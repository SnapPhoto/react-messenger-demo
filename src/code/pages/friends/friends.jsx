import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../../App.css';
import App_Router from '../../../app_router/app_router';
import { BrowserRouter } from 'react-router-dom';
import Input_Default from '../../../components/inputs/input_default/input_default';
import Button_Default from '../../../components/buttons/button_default/button_default';
import Loader from '../../../components/loader/loader';
import Searcher from '../../../components/searcher/search';
import axios from 'axios';
import Invites_Page from '../invites_page/invites_page.jsx';
import Notification_Bar from '../../../components/notification_bar/notification_bar.jsx';

export const Friends = ({token, set_s_user, set_curr_user, set_name_of_current_mail, my_id, visiable_panel_with_invites, set_visiable_panel_with_invites, ws_message_type, ws_ref, my_name}) => {

	const [avatars, set_avatars] = useState([]);

	const [who_send, set_who_send] = useState(null);

	const [friends, set_friends] = useState([]); // друзья
	const [default_friends, set_default_friends] = useState([]);
	const unique_friends = new Set();

	const [is_loading_friends, set_is_loading_friends] = useState(false);
	const [is_loading_confirm, set_is_loading_confirm] = useState(false);
	const [is_loading_outgoing, set_is_loading_outgoing] = useState(false);

	const [outgoing_friends, set_outgoing_friends] = useState([]); // исходящие запросы в друзья

	const [await_confirm_friends, set_await_confirm_friends] = useState([]); // входящие запросы в друзья

	const [incoming_outgoing, set_incoming_outgoing] = useState('added');

	const [selected_user, set_selected_user] = useState(null);

	const navigate = useNavigate();

	useEffect(()=>{
		if( ws_ref.current !== null ){
			console.log('ws_ref = ', ws_ref)
		}
	},[ws_ref.current])

	useEffect(()=>{
		async function get_avatars(){
			try{
				let a = [];
				const Files = (context)=>context.keys().map(context);
				const images = await Files(require.context('../../../images/profils', false, /\.(jpg)$/));
				if( images.length > 0 ){
					images.map((img)=>{
						const raw_name = img.split('/')[3].split('.');
						const name = raw_name[0] + '.' + raw_name[2];
						default_friends.map((friend)=>{
							if( friend.avatar === name ){
								a.push({
									path: img,
									name: friend.avatar,
								});
							}
						});
						if( await_confirm_friends.length > 0 ){
							await_confirm_friends.map(friend=>{
								if( friend.avatar === name ){
									a.push({
										path: img,
										name: friend.avatar,
									})
								}
							})
						};
						if( outgoing_friends.length > 0 ){
							outgoing_friends.map(friend=>{
								if( friend.avatar === name ){
									a.push({
										path: img,
										name: friend.avatar,
									})
								}
							})
						}
					})
				};
				if( a.length > 0 ){
					set_avatars(a);
				}
			}
			catch(err){
				return console.error('Ошибка аватаров: ', err);
			};
		};
		get_avatars();
	},[default_friends, outgoing_friends, await_confirm_friends]);


	useEffect(()=>{
		if( selected_user !== null ){
			set_s_user(selected_user);
		}
	},[selected_user])


	function set_current_user(user){
		set_selected_user(null);
		set_selected_user(user);
	};


	async function get_outgoing_friends(){
		set_outgoing_friends([]);
		set_is_loading_outgoing(true);
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('http://localhost:8080/main/get_outgoing_friends', {}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response ){
				if( response.data?.outgoing ){
					set_outgoing_friends( response.data?.outgoing );
					set_is_loading_outgoing(false);
				}
				else{
					set_is_loading_outgoing(false)
				}
			}
		}
		catch(err){
			console.error('Ошибка: ', err)
		}
	};


	async function get_await_confirm_friends(){
		set_await_confirm_friends([]);
		set_is_loading_confirm(true);
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('http://localhost:8080/main/get_await_confirm_friends', {}, {
				headers: {
					Authorization: `Bearer ${token}`,
				}
			});
			if( response.data?.exit ){
				localStorage.removeItem('token');
			};
			if( response.data?.await_confirm ){
				set_await_confirm_friends( response.data?.await_confirm );
				set_is_loading_confirm(false);
			}
			else{
				// заявок нету
				set_is_loading_confirm(false)
			}
		}
		catch(err){
			console.error('Ошибка: ', err);
		}
	};

	async function get_friends(){
		if( !token ){
			return;
		};
		set_is_loading_friends(true);
		try{
			const response = await axios.post('http://localhost:8080/main/get_friends', {}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			const raw_friends = Array.isArray(response.data?.friends) ? response.data.friends : [];
			const mapped_friends = raw_friends.map(friend => ({
				name: friend.name,
				email: friend.email,
				last_activity: friend.last_activity,
				id: friend.id,
				avatar: friend.profil_avatar,
				t_number: friend.t_number || 'телефон не указан',
			}));
			const unique_mapped_friends = Array.from(
				new Map(mapped_friends.map(friend => [String(friend.id), friend])).values()
			);
			set_friends(unique_mapped_friends);
			set_default_friends(unique_mapped_friends);
		}
		catch(err){
			console.error('Ошибка загрузки подтверждённых друзей: ', err);
		}
		finally{
			set_is_loading_friends(false);
		}
	};

	async function confirm_friend(id){
		if( token ){
			try{
				const response = await axios.post('http://localhost:8080/main/confirm_friend', {}, {
					headers: {
						Authorization: `Bearer ${token}`,
						confirm_id: id,
					}
				});
				if( response ){
					if( response.data?.refresh === true ){
						get_await_confirm_friends();
						get_outgoing_friends();
						get_friends();
					}
					console.log(response.data?.message);
					console.log('friends: ', response.data?.friends);

					//обратная отправка через websocket
					try{
						ws_ref.current.send(JSON.stringify({
							type: 'confirm_friend',
							for: ws_message_type?.from, // обратный id (from) для for
							from: ws_message_type?.for, // обратный id (for) для from
						}))
					} 
					catch(err){
						console.error('Ошибка обратной отправки: ', err);
					}
				}
			}
			catch(err){
				return console.error('Ошибка принятия в друзья: ', err)
			}
		}
	};


	async function cancel_confirm(id){
		if( token ){
			try{
				const response = await axios.post('http://localhost:8080/main/cancel_confirm_friend', {}, {
					headers: {
						Authorization: `Bearer ${token}`,
						cancel_confirm_id: id,
					}
				});
				if( response ){
					if( response.data?.refresh === true ){
						get_await_confirm_friends();
						get_outgoing_friends();
					}

					//обратная отправка через websocket
					try{
						ws_ref.current.send(JSON.stringify({
							type: 'cancel_add_friend',
							for: ws_message_type?.from, // обратный id (from) для for
							from: ws_message_type?.for, // обратный id (for) для from
						}))
					} 
					catch(err){
						console.error('Ошибка обратной отправки: ', err);
					}
				}
			}
			catch(err){
				return console.error('Ошибка отмены запроса: ', err)
			}
		}
	};


	async function remove_friend(id){
		if( token ){
			try{
				const response = await axios.post('http://localhost:8080/main/remove_friend', {}, {
					headers: {
						Authorization: `Bearer ${token}`,
						remove_id: id,
					}
				});
				if( response ){
					if( response.data?.refresh === true ){
						get_friends();
					}

					// прокидывание через websocket
					try{
						if( ws_ref.current !== null && ws_ref.current.readyState === 1 ){
							ws_ref.current.send(JSON.stringify({
								type: 'remove_friend',
								for: id,
								from: my_id,
							}))
						};
					}
					catch(err){
						throw err;
					}
				}
			}
			catch(err){
				return console.error('Ошибка удаления пользователя из друзей: ', err)
			}
		}
	};

	useEffect(()=>{
		function m_leave(){
			panel_with_options.style.display = 'none';
		}
		const panel_with_options = document.querySelector('.panel-with-options');
		if( !panel_with_options ){
			return;
		};
		panel_with_options.removeEventListener('mouseleave', m_leave);
		panel_with_options.addEventListener('mouseleave', m_leave);
		return ()=>{
			panel_with_options.removeEventListener('mouseleave', m_leave);
		}
	},[])

	useEffect(()=>{
		get_friends();
		get_await_confirm_friends();
	},[token]);

	useEffect(()=>{
		if( (ws_message_type?.type === 'add_friend') || (ws_message_type?.type === 'cancel_add_friend') || (ws_message_type?.type === 'remove_friend') || (ws_message_type?.type === 'confirm_friend') ){
			if( ws_message_type?.for === my_id || ws_message_type?.from === my_id ){
				get_await_confirm_friends();
				get_friends();
			}
		}
	},[ws_message_type])

	useEffect(()=>{
		if( who_send !== null ){
			set_name_of_current_mail(who_send.name || who_send.name_to_send);
			if( who_send.id !== null && who_send.id !== undefined ){
				set_curr_user(who_send.id);
				console.log('[1] who_send.id: ', who_send.id)
			}
			else if( who_send !== null){
				set_curr_user(who_send)
				console.log('[2] who_send: ', who_send)
			};
			if( who_send.from && who_send.to ){
				console.log('who_send.from = ', who_send.from);
				console.log('who_send.to = ', who_send.to);
				navigate(`/mail/${who_send.from}/${who_send.to}/${who_send.name || who_send.name_to_send}/mails`);
			}
			else{
				console.log('my_id_ref.current = ', my_id);
				console.log('who_send.id = ', who_send.id);
				// return;
				navigate(`/mail/${my_id}/${who_send.id}/${who_send.name || who_send.name_to_send}/mails`);
			}
		}
		else {
			console.log('Данных нет')
		}
	},[who_send])

	return (
		<div className='friends'>
			<div className='panel-header'>
				<div className='panel-header-item'>
					item 1
				</div>
				<div className='panel-header-item'>
					item 2
				</div>
				<div className='panel-header-item'>
					item 3
				</div>
				<div className='panel-header-item'>
					item 4
				</div>
			</div>
			<div className='row'>
				<div className='col-2'>
					<div className='blocks' style={{display: 'block'}}>
						<div className='block-item' style={{textAlign: 'left', padding: '2px', boxSizing: 'border-box'}}>
							<Link className='link' to={`/main/${my_id}/page`}> Моя страница </Link>
							<Link className='link' to='/main/peoples'> Люди </Link>
							<Link className='link' to='/main/friends'> Друзья <Notification_Bar type={'friends'} ws_message_type={ws_message_type} my_id={my_id} my_name={my_name}></Notification_Bar></Link>
							<Link className='link' to='/account/mail'> Сообщения <Notification_Bar type={'mails'} ws_message_type={ws_message_type} my_id={my_id} my_name={my_name}></Notification_Bar></Link>
							<Link className='link' to='/main/groups'> Группы </Link>
							<Link className='link' to={`/main/${my_id}/favourites`}> Избранное </Link>
							{/* <Link className='link' to=''> Уведомления </Link>   */}
							<Link className='link' onClick={()=>{set_visiable_panel_with_invites(true)}}> Приглашения <Notification_Bar type={'invites'} ws_message_type={ws_message_type} my_id={my_id} my_name={my_name}></Notification_Bar></Link>
						</div>
					</div>
				</div>
				<div className='split'>
					{/* разделение */}
				</div>
				<div className='col-8'>
					{/* панель с Приглашениями / Уведомлениями */}
					{visiable_panel_with_invites &&
						<Invites_Page
							close={()=>{set_visiable_panel_with_invites(false)}}
						></Invites_Page>
					}
					{/* информация о выбранном пользователе */}
					{selected_user !== null
					?
						<div className='selected-user'>
							<div className='blocks'>
								<div className='block-item'>
									<div className='row'>
										<div className='selected-user-avatar'>
											{selected_user.avatar 
											?
												<div className='selected-user-avatar-true'>
													<img className='icon' onClick={()=>{navigate(`/main/${selected_user ? selected_user.id : 'user_undefined'}/page`)}} src={avatars.find(avatar => avatar.name === selected_user.avatar)?.path}/>
												</div>
											:
												<div className='selected-user-avatar-false'>
													
												</div>	
											}
										</div>
										<div className='selected-user-name'>
											{selected_user.name}
										</div>
										<div className='selected-user-buttons'>
											<Button_Default
												onClick={()=>{
													document.querySelector('.panel-with-options').style.display = 'block';
												}}
											>...</Button_Default>
										</div>
									</div>
								</div>
							</div>
						</div>
					:
						<div>
							{/* не выбран пользователь */}
						</div>
					}

					{/* группа блоков */}
					<div className='blocks'>
						<div className='block-item'>
							<div className='search'>
								<Searcher
									value={friends}
									default_value={default_friends}
									set_value={set_friends}
								>	
								</Searcher>
							</div>
						</div>
					</div>
					{/* группа блоков */}
					<div className='blocks'>
						<div className='row' style={{
							// backgroundColor: 'white',
						}}>
							<div className='col-5' style={{marginRight: '5px'}}>
								<Button_Default onClick={()=>{set_incoming_outgoing('added'); get_friends()}} style={{width: '100%'}}>Подтверждённые</Button_Default>
							</div>
							<div className='col-5' style={{marginRight: '5px'}}>
								<Button_Default onClick={()=>{set_incoming_outgoing('incoming'); get_await_confirm_friends()}} style={{width: '100%'}}>Входящие</Button_Default>
							</div>
							<div className='col-5' style={{marginLeft: '5px'}}>
								<Button_Default onClick={()=>{set_incoming_outgoing('outgoing'); get_outgoing_friends()}} style={{width: '100%'}}>Исходящие</Button_Default>
							</div>
						</div>
					</div>

					{/* заявки входящие и исходящие */}
					<div className='blocks'>
						{incoming_outgoing === 'incoming' 
						?
							<div className='block-item'>
								{await_confirm_friends.length > 0 
								?
									<div>
										<div>
											Заявки в друзья
										</div>
										{await_confirm_friends.map((user)=>
											<div key={user.id}>
												<div className='people'>
													<div className='people-data'>
														<div className='row'>
															<div>
																{user.avatar 
																?
																	<div onClick={()=>{set_current_user(user)}} className='people-icon-true'>
																		<img className="icon" src={avatars.find(a=>a.name === user.avatar)?.path}/>
																	</div>
																:
																	<div onClick={()=>{set_current_user(user)}} className='people-icon-false'>
																		-
																	</div>
																}
															</div>
															<div className='people-name' onClick={()=>{set_current_user(user)}}>
																{user.name}
															</div>										{/* написать функции + и - */}
															<div className="await-confirm-btn">    
																<div className='people-button-add'>
																	<Button_Default  onClick={()=>{confirm_friend(user.id)}}>Принять</Button_Default>
																</div>
																<div className='people-button-add'>
																	<Button_Default  onClick={()=>{cancel_confirm(user.id)}}>Отклонить</Button_Default>
																</div>
															</div>
														</div>
													</div>
													<div className='split'>
														{/* разделитель */}
													</div>
												</div>
											</div>
										)}
									</div>
								:
									<div>
										{is_loading_confirm === true
										?
											<div style={{
												display: 'flex',
												justifyContent: 'center',
												padding: '10px 0',
											}}>
												<Loader></Loader>
											</div>
										:
											<div>Заявок в друзья нет</div>
										}
									</div>
								}
							</div>
						: incoming_outgoing === 'outgoing' 
						?
							<div className='block-item'>
								{outgoing_friends.length > 0 
								?
									<div>
										<div>
											Исходящие заявки
										</div>
										{outgoing_friends.map((user)=>
											<div key={user.id}>
												<div className='people'>
													<div className='people-data'>
														<div className='row'>
															<div>
																{user.avatar 
																?
																	<div onClick={()=>{set_current_user(user)}} className='people-icon-true'>
																		<img className="icon"src={avatars.find(a=>a.name === user.avatar)?.path}/>
																	</div>
																:
																	<div onClick={()=>{set_current_user(user)}} className='people-icon-false'>
																		
																	</div>
																}
															</div>
															<div className='people-name' onClick={()=>{set_current_user(user)}}>
																{user.name}
															</div>										{/* написать функции + и - */}
															<div className="await-confirm-btn">    
																<div className='people-button-add'>
																	<Button_Default  onClick={()=>{cancel_confirm(user.id)}}>Отменить запрос</Button_Default>
																</div>
															</div>
														</div>
													</div>
													<div className='split'>
														{/* разделитель */}
													</div>
												</div>
											</div>
										)}
									</div>
								:
									<div>
										{is_loading_outgoing === true
										?
											<div style={{
												display: 'flex',
												justifyContent: 'center',
												padding: '10px 0',
											}}>
												<Loader></Loader>
											</div>
										:
											<div>Исходящих заявок нет</div>
										}
									</div>
								}
							</div>
						: incoming_outgoing === 'added' &&
							<div className='block-item'>
								{friends.length > 0
								?
									<div>
										<div>
											Подтверждённые
										</div>
										{friends.map((friend, index) =>
											<div className='people' key={index}>
												<div className='people-data'>
													<div className='row'>
														<div>
															{friend.avatar 
															?
																<div onClick={()=>{set_current_user(friend); navigate(`/main/${friend ? friend.id : 'user_undefined'}/page`)}} className='people-icon-true'>
																	<img className="icon"src={avatars.find(a=>a.name === friend.avatar)?.path}/>
																</div>
															:
																<div onClick={()=>{set_current_user(friend)}} className='people-icon-false'>
																	
																</div>
															}
														</div>
														<div className='people-name' onClick={()=>{set_current_user(friend)}}>
															{friend.name}
														</div>
														<div className='people-button-add'>
															<Button_Default onClick={()=>{remove_friend(friend.id)}}>Удалить из друзей</Button_Default>
														</div>
													</div>
												</div>
												<div className='split'>
													{/* разделитель */}
												</div>
											</div>
										)}
									</div>
								:
									<div>
										{is_loading_friends === true
										?
											<div style={{
												display: 'flex',
												justifyContent: 'center',
												padding: '10px 0',
											}}>
												<Loader></Loader>
											</div>
										:
											<div>Друзей нет</div>
										}
									</div>
								}
							</div>
						}
					</div>

					{/* подтверждённые s */}

					<div className='panel-with-options'>
						<div className='panel-with-options-block'>
							<Link className='link' to={`/main/${selected_user ? selected_user.id : 'user_undefined'}/page`}> Открыть профиль</Link>
						</div>
						<div className='panel-with-options-block'>
							<Link className='link' onClick={()=>{set_who_send(selected_user)}}> Написать сообщение </Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
};

export default Friends;