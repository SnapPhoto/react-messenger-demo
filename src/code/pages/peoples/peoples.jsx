import React, { useState, useEffect, useRef, useMemo} from 'react';
import { Link, useNavigate} from 'react-router-dom';
import '../../../App.css';
import App_Router from '../../../app_router/app_router';
import { BrowserRouter } from 'react-router-dom';
import Input_Default from '../../../components/inputs/input_default/input_default';
import Button_Default from '../../../components/buttons/button_default/button_default';
import Searcher from '../../../components/searcher/search';
import axios from 'axios';
import Invites_Page from '../invites_page/invites_page.jsx';
import Notification_Bar from '../../../components/notification_bar/notification_bar.jsx';

export const Peoples = ({token, set_token, set_s_user, set_curr_user, set_name_of_current_mail, my_id, visiable_panel_with_invites, set_visiable_panel_with_invites, ws_message_type, ws_ref, my_name}) => {

	const [avatars, set_avatars] = useState([]);
	const [peoples, set_peoples] = useState([]);
	const [default_peoples, set_default_peoples] = useState([]);
	const unique_peoples = new Set();
	const my_id_ref = useRef(null);
	const [who_send, set_who_send] = useState(null);
	const [selected_user, set_selected_user] = useState(null);

	const navigate = useNavigate();

	useEffect(()=>{
		if( selected_user !== null ){
			set_s_user(selected_user);
		}
	},[selected_user])

	// ИСПОЛЬЗУЙ, ЕСЛИ ХОЧЕШЬ ОБНУЛИТЬ АВАТАР ГЛОБАЛЬНО

	// async function update_peoples(){
	// 	const token = localStorage.getItem('token');
	// 	if( !token ){
	// 		return console.log('Токен не найден!');
	// 	};
	// 	try{
	// 		const response = await axios.post('http://localhost:8080/set_default_profil_avatar_for_all_users', {}, {
	// 			headers: {
	// 				Authorization: `Bearer ${token}`
	// 			}
	// 		});
	// 		if( response.data?.refresh ){
	// 			console.log('Обновление данных пользователей успешно!');
	// 		};
	// 	}
	// 	catch(err){
	// 		return console.error('Ошибка: ', err);
	// 	}
	// }
	// useEffect(()=>{
	// 	update_peoples()
	// },[])

	// async function remove_all_users(){
	// 	try{
	// 		await axios.post('http://localhost:8080/remove_all_users', {}, {});
	// 	}
	// 	catch(err){
	// 		return console.log('Ошибка: ', err);
	// 	}
	// }
	// useEffect(()=>{
	// 	remove_all_users();
	// },[])

	// async function remove_all_messages(){
	// 	try{
	// 		const response = await axios.post('http://localhost:8080/remove_all_messages', {}, {})
	// 	}
	// 	catch(err){
	// 		return console.error('Ошибка: ', err);
	// 	}
	// }
	// useEffect(()=>{
	// 	remove_all_messages()
	// },[])

	async function add_friend(id){
		if( id ){
			try{
				const response = await axios.post('http://localhost:8080/main/add_friend', {}, {
					headers: {
						people_id: id,
						Authorization: `Bearer ${token}`
					}
				});
				if( response ){
					if( response.data?.exit ){
						set_token(null);
					}
				};
				if( response.data?.message ){
					// Запрос отправлен
					get_peoples()

					// прокидывание через websocket
					ws_ref.current.send(JSON.stringify({
						type: 'add_friend',
						for: id,
						from: my_id,
					}))
				}
			}
			catch(err){
				console.error('Ошибка: ', err);
			}
		}
	};


	async function cancel_add_friend(id){
		if( id ){
			try{
				const response = await axios.post('http://localhost:8080/main/cancel_add_friend', {}, {
					headers: {
						people_id: id,
						Authorization: `Bearer ${token}`
					}
				});
				if( response ){
					if( response.data?.exit ){
						set_token(null);
					}
				};
				if( response.data?.message ){
					get_peoples()

					// прокидывание через websocket
					ws_ref.current.send(JSON.stringify({
						type: 'cancel_add_friend',
						for: id,
						from: my_id,
					}))
				}
			}
			catch(err){
				console.error('Ошибка: ', err);
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
						get_peoples();

						// прокидывание через websocket
						ws_ref.current.send(JSON.stringify({
							type: 'cancel_confirm_friend',
							for: id,
							from: my_id,
						}))
					}
				}
			}
			catch(err){
				return console.error('Ошибка отмены запроса: ', err)
			}
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
						get_peoples();

						// прокидывание через websocket
						ws_ref.current.send(JSON.stringify({
							type: 'confirm_friend',
							for: id,
							from: my_id,
						}))
					}
					console.log(response.data?.message);
					console.log('friends: ', response.data?.friends);
				}
			}
			catch(err){
				return console.error('Ошибка принятия в друзья: ', err)
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
						get_peoples();

						// прокидывание через websocket
						ws_ref.current.send(JSON.stringify({
							type: 'remove_friend',
							for: id,
							from: my_id,
						}))
					}
				}
			}
			catch(err){
				return console.error('Ошибка удаления пользователя из друзей: ', err)
			}
		}
	};

	const get_memo_peoples = useMemo(()=>{

	},[])

	async function get_peoples(){
		console.log('get_peoples')
		set_peoples([])
		set_default_peoples([])
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('http://localhost:8080/main/get_peoples', {}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response ){
				my_id_ref.current = response.data?.myId;
				const raw_peoples = response.data?.peoples;
				if( raw_peoples !== undefined && raw_peoples.length > 0 ){
					const unique = raw_peoples.filter((p)=>{
						const id = p?._id;
						if( id === null || unique_peoples.has(id) ){
							console.log(`id [${id}] уже существует!`)
							return false;
						};
						unique_peoples.add(id)
						console.log('')
						return true
					});
					console.log('[unique] = ', unique);
					unique.forEach((people, index)=>{
						let p = {
							name: people.name,
							email: people.email,
							last_activity: people.last_activity,
							id: people._id,
							avatar: people.profil_avatar,
							btn_add: people.waiting_confirm_friends,
							t_number: people.t_number,
							await_confirm: people.waiting_add_friends.includes(response.data?.myId) ? true : false,
							friends: people.friends,
							friend: people.friends.includes(people.id) ? true : false 
						};
						set_peoples(people => [...people, p]);
						set_default_peoples(people => [...people, p]);
					});
				}
			};
		}
		catch(err){
			console.error('Ошибка: ', err)
		}
	};


	useEffect(()=>{
		get_peoples();
	},[]);

	useEffect(()=>{
		if( peoples.length > 0 ){
			peoples.forEach((people)=>{
				if( people.btn_add.length > 0 ){
					if( people.btn_add.includes(my_id_ref.current) ){
						
					} 
				}
			})
		}
	},[peoples]);


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
						default_peoples.map((friend)=>{
							if( friend.avatar === name ){
								a.push({
									path: img,
									name: friend.avatar,
								});
							}
						});
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
	},[default_peoples]);

	function set_current_user(user){
		set_selected_user(null);
		set_selected_user(user);
	};

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

	useEffect(()=>{
		if( (ws_message_type?.type === 'add_friend') || (ws_message_type?.type === 'cancel_add_friend') || (ws_message_type?.type === 'remove_friend') || (ws_message_type?.type === 'confirm_friend') ){
			if( ws_message_type?.for === my_id ){
				get_peoples();
			}
		}
	},[ws_message_type])

	return (
		<div className='peoples'>
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
							{/* <Link className='link' to=''> Уведомления </Link>  */}
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
									value={peoples}
									default_value={default_peoples}
									set_value={set_peoples}
								>	
								</Searcher>
							</div>
						</div>
					</div>
					{/* группа блоков */}
					<div className='blocks'>
						<div className='block-item'>
							{peoples.length > 0
							?
								<div>
									{peoples.map( (people) =>
										<div className='people' key={people.id} onClick={()=>{set_current_user(people)}}>
											<div className='people-data'>
												<div className='row'>
													<div>
														{people.avatar 
														?
															<div className='people-icon-true'>
																<img className="icon" src={avatars.find(a=>a.name === people.avatar)?.path}/>
															</div>
														:
															<div className='people-icon-false'>
																
															</div>
														}
													</div>
													<div className='people-name'>
														{people.name}
													</div>
													{people.friends.includes(my_id_ref.current) 
													? 
														<div>
															<div className='people-button-add'>
																	<Button_Default  onClick={()=>{remove_friend(people.id)}}>Удалить из друзей</Button_Default>
																</div>
														</div>
													: 
														<div>
															{people.btn_add.includes(my_id_ref.current) 
															?
																<div className='people-button-add'>
																	<Button_Default  onClick={()=>{cancel_add_friend(people.id)}}>Отменить запрос</Button_Default>
																</div>
															:
																<div>
																	{people.await_confirm
																	?
																	<div className="await-confirm-btn">    
																		<div className='people-button-add'>
																		<Button_Default  onClick={()=>{confirm_friend(people.id)}}>Принять</Button_Default>
																		</div>
																		<div className='people-button-add'>
																		<Button_Default  onClick={()=>{cancel_confirm(people.id)}}>Отклонить</Button_Default>
																		</div>
																	</div>
																	:
																		<div className='people-button-add'>
																			<Button_Default  onClick={()=>{add_friend(people.id)}}>Добавить в друзья</Button_Default>
																		</div>
																	}
																</div>
															}
														</div>
													}
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
									Пустота...
								</div>
							}
						</div>
					</div>
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

export default Peoples;