import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../../App.css';
import App_Router from '../../../app_router/app_router';
import { BrowserRouter } from 'react-router-dom';
import Input_Default from '../../../components/inputs/input_default/input_default';
import Button_Default from '../../../components/buttons/button_default/button_default';
import axios from 'axios';
import Searcher from '../../../components/searcher/search';
import Invites_Page from '../invites_page/invites_page.jsx'; 
import Voice from '../../../components/voice/voice.jsx';
import Notification_Bar from '../../../components/notification_bar/notification_bar.jsx';

export const Account_Mail = ({token, set_name_of_current_mail, set_curr_user, my_id, visiable_panel_with_invites, set_visiable_panel_with_invites, ws_message_type, ws_ref, my_name}) => {
	const [friends, set_friends] = useState([]);
	const [peoples, set_peoples] = useState([]);

	const [default_friends, set_default_friends] = useState([]);
	const [default_peoples, set_default_peoples] = useState([]);

	const [who_sender, set_who_sender] = useState('friends');
	const [add_new_msg, set_add_new_msg] = useState(false);
	const [panel_new_msg, set_panel_new_msg] = useState(false);
	const [who_send, set_who_send] = useState(null);

	const [msg_text, set_msg_text] = useState('');

	const [visiable_full_date, set_visiable_full_date] = useState(null); //отображение полной даты при наведении на mail-date

	const navigate = useNavigate();

	const my_id_ref = useRef(null);
	const [is_loading_friends, set_is_loading_friends] = useState(false);
	const [mails, set_mails] = useState([]);
	const [default_mails, set_default_mails] = useState([]);
	const [mails_normal_date, set_mails_normal_date] = useState([]);

	const [search_text_active, set_search_text_active] = useState('');
	const [search_text_friends, set_search_text_friends] = useState('');
	const [search_text_peoples, set_search_text_peoples] = useState('');

	const [profil_avatars, set_profil_avatars] = useState([]);
	const [mails_data, set_mails_data] = useState([]);
	const [active_users_data, set_active_users_data] = useState([]);
	const [updated_active_users_data, set_updated_active_users_data] = useState([]);

	useEffect(()=>{
		if( !token ){
			return;
		};
		try{
			const raw_avatars = (context) => context.keys().map(context);
			const avatars = raw_avatars(require.context('../../../../src/images/profils'));
			if( avatars.length > 0 ){
				avatars.map((avatar, index) => {
					const raw_avatar_name = avatar.split('/')[3].split('.');
					const avatar_name = raw_avatar_name[0] + '.' + raw_avatar_name[2];
					set_profil_avatars(profil_avatars => [...profil_avatars, {
						path: avatar,
						name: avatar_name,
					}]);
				})
			}
		}
		catch(err){
			console.error('Ошибка загрузки аватаров', err)
		}
	},[mails]);

	useEffect(()=>{
		if( !token && default_mails.length > 0 ){
			return;
		}
		async function get_data_active_mails(){
			try{
				if( !default_mails.length > 0 ){
					return;
				}
				const response = await axios.post('http://localhost:8080/get_data_active_mails', {
					active_mails: JSON.stringify(default_mails),
				}, {
					headers: {
						Authorization: `Bearer ${token}`,
					}
				});
				if( response.data?.message && response.data?.data_profil_avatar ){
					const data_active_mails = response.data?.data_profil_avatar;
					if( data_active_mails ){
						set_mails_data(data_active_mails);
					}
				};
			}
			catch(err){
				console.error('Не удалось получить аватарки активных сообщений. ', err);
			}
		};
		get_data_active_mails();
	},[default_mails]);

	useEffect(()=>{
		mails_data.map((m)=>{
			profil_avatars.map((p)=>{
				if( p.name === m.user_profil_avatar ){
					set_active_users_data(active_users_data => [...active_users_data, {
						user_id: m.user_id,
						avatar_name: p.name,
						avatar_path: p.path,
						mail_id: my_id_ref.current === m.from ? mails.find(item=>item.to === my_id_ref.current)?._id : mails.find(item=>item.from === my_id_ref.current)?._id
					}])
				}
			})
		})
	},[mails_data, profil_avatars])

	useEffect(()=>{
		//вывод информации, чтобы не запутаться
		if( mails.length > 0 && mails_data.length > 0 && active_users_data.length > 0 ){
			console.log('--------------')
			mails.forEach((mail)=>{
				console.log('mail: ', mail)
			});
			mails_data.forEach((mail_data)=>{
				console.log('mail_data: ', mail_data)
			});
			active_users_data.forEach((active_user_data)=>{
				console.log('active_user_data: ', active_user_data);
			});
		}
	},[mails, mails_data, active_users_data]);

	// добавление mail_id в active_user_data... на эту хрень ушёл целый день... ужас...
	useEffect(()=>{
		const unique = new Set();
		if( active_users_data.length > 0 ){
			active_users_data.map((a_item)=>{
				mails.map((m_item)=>{
					if( a_item.user_id === m_item.from ){
						if( !unique.has(a_item.user_id) ){
							unique.add(a_item.user_id);
							const mail_map = new Map(mails.map(item=>[item.from, item._id]));
							const new_active_users_data = active_users_data.map(user=>({
								...user,
								mail_id: mail_map.get(user.user_id)
							}))
							if( new_active_users_data.length > 0 ){
								set_updated_active_users_data(new_active_users_data);
								console.log('+ active_user_data = ', active_users_data)
							}
						}
					}
				})
			})
		}
	},[active_users_data]);

	useEffect(()=>{
		if( updated_active_users_data.length > 0 ){
			console.log('updated_active_users_data = ', updated_active_users_data)
		}
	},[updated_active_users_data])

	useEffect(()=>{
		function to_top(){
			window.scrollTo({
				top: 0,
				behavior: 'smooth',
			})
		};
		to_top();
	},[])

	// конвертация даты в нормальный вид
	useEffect(()=>{
		if( mails.length > 0 ){
			mails.forEach((mail, index)=>{
				const get_date = mail.date;
				if( get_date ){
					const date = new Date(mail.date);
					if( isNaN(date.getTime())){
						console.log('Некорректная дата');
						return;
					};
					const year = date.getFullYear();
					const month = String(date.getMonth() + 1).padStart(2,'0');
					const day = String(date.getDate()).padStart(2,'0');
					const hour = String(date.getHours()).padStart(2,'0');
					const minute = String(date.getMinutes()).padStart(2,'0');

					if( year && month && day && hour && minute ){
						set_mails_normal_date((mails_normal_date)=>[...mails_normal_date, {
							index: index,
							year: year,
							month: month,
							day: day,
							hour: hour,
							minute: minute,
						}])
					}
				}
			});
		}
	},[mails])

	async function write_new_message(){
		set_add_new_msg(true);
	};

	async function send_new_message(){
		if( msg_text !== '' && msg_text.length > 0 && msg_text.trim() !== '' ){
			let replaced_msg = '';
			replaced_msg = msg_text;
			if( msg_text.split(' ')[1]){
				replaced_msg = msg_text.trim();
			};
			console.log(replaced_msg)
		}
	};

	async function get_friends(){
		set_friends([])
		set_is_loading_friends(true);
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('http://localhost:8080/main/get_friends', {}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response.data?.friends ){
				const raw_friends = response.data?.friends;
				raw_friends.forEach((friend, index)=>{
					let p = {
						name: friend.name,
						email: friend.email,
						last_activity: friend.last_activity,
						id: friend.id,
						avatar: friend.profil_avatar,
						t_number : friend.t_number || 'телефон не указан',
					};
					set_friends(friend => [...friend, p]);
					set_default_friends(friend => [...friend, p]);
					set_is_loading_friends(false);
				});
			}
			else{
				set_is_loading_friends(false)
			}
		}
		catch(err){
			console.error('Ошибка: ', err)
		}
	};

	async function get_peoples(){
		set_peoples([])
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
					raw_peoples.forEach((people, index)=>{
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

	async function get_mails(){   
		console.log('_________[get_mails]')
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('http://localhost:8080/main/get_active_messages', {}, {
				headers: {
					Authorization: `Bearer ${token}`,
				}
			});
			if( response.data.msg ){
				console.log(response.data.message );
				set_mails(response.data.msg);
				set_default_mails(response.data.msg);
			}
		}
		catch(err){
			return console.error('Ошибка загрузки списка сообщений ',err);
		}
	};

	useEffect(()=>{
		get_friends();
		get_peoples();
		get_mails();
	},[])

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
				console.log('my_id_ref.current = ', my_id_ref.current);
				console.log('who_send.id = ', who_send.id);
				// return;
				navigate(`/mail/${my_id_ref.current}/${who_send.id}/${who_send.name || who_send.name_to_send}/mails`);
			}
		}
		else {
			console.log('Данных нет')
		}

		function resize_textarea(textarea){
			textarea.style.height = '40px';
			textarea.style.height = textarea.scrollHeight + 'px';
		};
		const textarea = document.querySelector('.auto-grow');
		if( textarea ){
			const handler_resize = () => resize_textarea(textarea);
			textarea.addEventListener('input', handler_resize);

			return ()=>{
				textarea.removeEventListener('imput', handler_resize);
			}
		}
	},[who_send]);

	function get_normal_date(raw_date, type){
		if( type === 'low'){
			const date = new Date(raw_date);
			const year = date.getFullYear();
			const month = date.getMonth() + 1;
			const day = date.getDate();
			const raw_hour = date.getHours();
			const hour = (raw_hour)=>{
				if( raw_hour === 0 ){
					return '00';
				}
				else{
					return raw_hour;
				}
			}
			const minutes = date.getMinutes();
			return `${hour(raw_hour)}ч. ${minutes}м.`;
		};
		if( type === 'full' ){
			const date = new Date(raw_date);
			const year = date.getFullYear();
			const raw_month = date.getMonth() + 1;
			const month = (raw_month)=>{
				if( raw_month === 1 ){ return 'Января' };
				if( raw_month === 2 ){ return 'Февраля'};
				if( raw_month === 3 ){ return 'Марта'};
				if( raw_month === 4 ){ return 'Апреля'};
				if( raw_month === 5 ){ return 'Мая'};
				if( raw_month === 6 ){ return 'Июня'};
				if( raw_month === 7 ){ return 'Июля'};
				if( raw_month === 8 ){ return 'Августа'};
				if( raw_month === 9 ){ return 'Сентября'};
				if( raw_month === 10 ){ return 'Октября'};
				if( raw_month === 11 ){ return 'Ноября'};
				if( raw_month === 12 ){ return 'Декабря'};
			}
			const day = date.getDate();
			const raw_hour = date.getHours();
			const hour = (raw_hour)=>{
				if(	raw_hour === 0 ){
					return '00'
				}
				else {
					return raw_hour;
				}
			}
			const minutes = date.getMinutes();
			return `${year}г. ${day} ${month(raw_month)}. ${hour(raw_hour)}ч. ${minutes}м.`;
		}
	}

	useEffect(()=>{
		if( ws_message_type !== null ){
			if( ws_message_type?.for?.to === my_id || ws_message_type?.for?.from === my_id ){
				get_mails();
			}
		};
	},[ws_message_type])

	return (
		<div className='account_mail'>
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
					{/* группа блоков */}
					<div className='blocks'>
						<div className='block-item'>
							<div className='search'>
								<div style={{width: '100%'}}>
									<Searcher
										value={mails}
										default_value={default_mails}
										set_value={set_mails}
										// my_id={my_id_ref.current}
									>
									</Searcher>
								</div>
							</div>
						</div>
					</div>
					{/* группа блоков */}
					{add_new_msg && who_send === null
					?
						<div>
							<div style={{
								display: 'inline-flex',
								justifyContent: 'center',
								padding: '5px 0 0 0',
							}}>
								<div style={{
									minWidth: '100px',
									width: '100px',
									backgroundColor: 'white',
									border: '1px solid lightgray',
									borderRadius: '25px 25px 0 0'
								}}>
									<Button_Default 
										onClick={()=>{set_add_new_msg(false)}}
										style={{
											backgroundColor: 'transparent',
											width: '100%',
											height: '100%',
											border: 'none',
											padding: '5px',
										}}
									>Закрыть</Button_Default>
								</div>
							</div>
							<div className='blocks'>
								<div className='block-item form-write-new-message'>
									<div className='row-center'
										style={{
											padding: '5px 0',
											backgroundColor: 'lightgray'
										}}
									>
										<div>
											<Button_Default style={{padding: '5px'}} onClick={()=>{set_who_sender('friends')}}> Список друзей  </Button_Default>
										</div>
										<div>
											<Button_Default style={{padding: '5px'}} onClick={()=>{set_who_sender('peoples')}}> Другому </Button_Default>
										</div>
									</div>
									<div className='searcher'>
										<Searcher
											value={who_sender === 'peoples' ? peoples : friends}
											default_value={who_sender === 'peoples' ? default_peoples : default_friends}
											set_value={who_sender === 'peoples' ? set_peoples : set_friends}
										>
										</Searcher>
									</div>
									<div className='who-sender-block'>
										{who_sender === 'peoples' 
										?  
											<div>
												{default_peoples.length > 0 &&
													peoples.map((people)=>
													<div key={people.id}>
														{/* <div> */}
														{/* 	{people.id} */}
														{/* </div> */}
														<div className='row' key={people.id}>
														<div className='who-sender'>
															<div className='who-sender-icon'>
																<img className="icon" src={profil_avatars.find(a=>a.name === people.avatar)?.path}/>
															</div>
															<div className='who-sender-name'>
																{people.name}
															</div>
															<div className='who-sender-he' onClick={()=>{set_who_send(people)}}>
																Отправить сообщение
															</div>
														</div>
													</div>
													</div>
												)
												}
											</div>
										:
											<div>
												{default_friends.length > 0
												?
													friends.map((friend)=>
														<div className='row' key={friend.id}>
															<div className='who-sender'>
																<div className='who-sender-icon'>
																	<img className="icon"src={profil_avatars.find(a=>a.name === friend.avatar)?.path}/>
																</div>
																<div className='who-sender-name'>
																	{friend.name}
																</div>
																<div className='who-sender-he' onClick={()=>{set_who_send(friend)}}>
																	Отправить сообщение
																</div>
															</div>
														</div>
													)
												:
													<div style={{padding: '10px 0 5px 0'}}>
														Друзей нет
													</div>
												}
											</div>
										}
									</div>
								</div>
							</div>
						</div>
					:
						<div className='blocks'>
							<div className='block-item write-new-message'>
								{who_send !== null
								?
									null
								:
									<Button_Default onClick={()=>{write_new_message()}}>
										Написать новое сообщение
									</Button_Default>
								}
							</div>
						</div>
					}
					{who_send !== null
					?
						<div className='blocks'>
							<div className='block-item'>
								<div className='form_new_msg'>
									<div className='row'
										style={{
											padding: '5px',
											boxSizing: 'border-box',
										}}
									>
										<div>
											Кому: {`${who_send ? who_send.name : 'имя не указано'}`}
										</div>
										<Button_Default 
											onClick={()=>{set_who_send(null)}}
											style={{
												border: '1px solid gray',
												backgroundColor: 'whitesmoke',
												minWidth: '40px',
												width: '40px',
												minHeight: '40px',
												height: '40px',
												right: '0',
												top: '0',
											}}
										>X</Button_Default>
									</div>
									<div className='row'>
										<div style={{
											padding: '5px',
											position: 'relative',
											width: '100%',
											boxSizing: 'border-box',
										}}>
											<textarea
												className='auto-grow'
												placeholder="Введите сообщение"
												value={msg_text}
												onChange={(e)=>{set_msg_text(e.target.value)}}
												style={{
													width: '100%',
													height: '38px',
													padding: '10px',
													boxSizing: 'border-box',
													resize: 'none',
													overflowX: 'hidden',
													overflowY: 'hidden',
													fontSize: 'calc(3px + 2vmin)',
													border: '1px solid gray',
													outline: 'none',
												}}	
											>	
											</textarea>
										</div>
										<div style={{
											display: 'flex',
											alignItems: 'end',
											padding: '5px 5px 5px 0',
											boxSizing: 'border-box',
										}}>
											<Button_Default
												onClick={()=>{send_new_message()}}
												style={{
													borderRadius: '25px',
													height: '100%',
													width: '100px',
													fontSize: '12px',
													border: '1px solid gray',
													backgroundColor: 'whitesmoke',
													margin: '2px',
												}}
											>Отправить</Button_Default>
										</div>
									</div>
								</div>
							</div>
						</div>
					:
						null
					}
					<div className='blocks'>
						<div className='block-item'>
							{/* <div style={{borderBottom: '1px solid lightgray', padding: '5px', marginBottom: '10px'}}> */}
							{/* 	-- */}
							{/* 	my id = {`${my_id_ref.current}`} */}
							{/* 	-- */}
							{/* </div> */}
							{mails && mails.length > 0
							?
								mails.map((mail, index)=>
									<div key={index}>
										{/* <div> */}
										{/* 	<div> */}
										{/* 		from = {`${mail.from}`}  */}
										{/* 	</div> */}
										{/* 	<div> */}
										{/* 		name from = {`${mail.name_sender}`} */}
										{/* 	</div> */}
										{/* 	<div> */}
										{/* 		to = {`${mail.to}`}  */}
										{/* 	</div> */}
										{/* 	<div> */}
										{/* 		name to = {`${mail.name_to_send}`} */}
										{/* 	</div> */}
										{/* 	<div> */}
										{/* 		id mail= {`${mail._id}`}  */}
										{/* 	</div> */}
										{/* </div> */}
										<div className='row' onClick={()=>{set_who_send(mail)}} key={mail._id}>
											<div className='mail'>
												<div className='mail-icon'>
													{/* аватарка */}
													<img src={
														mail.to === my_id_ref.current ? active_users_data.find(item=>item.user_id === mail.from)?.avatar_path : active_users_data.find(item=>item.user_id === mail.to)?.avatar_path 
													}/>
												</div>
												<div className='mail-name'>
													{mail.from !== my_id_ref.current
													?
														mail.name_sender
													:
														mail.name_to_send
													}
												</div>
												<div className={mail.status === 'uncheck' ? 'mail-message-no-seen' : mail.to === my_id_ref.current ? 'mail-message' : 'mail-message-i'}>
													{mail.message ? mail.message : mail.img ? 'Фотография' : 'Сообщение'}
												</div>
												<div className='mail-status-and-date'>
													<div className='mail-date' onMouseEnter={()=>{set_visiable_full_date({full_date: mail.date})}} onMouseLeave={()=>{set_visiable_full_date(null)}}>
														<div className='low-mail-date'>
															{get_normal_date(mail.date, 'low')}
														</div>
														{
															visiable_full_date?.full_date === mail.date &&
															<div className='full-mail-date'>
																{get_normal_date(mail.date, 'full')}
															</div>
														}
													</div>
													<div className='mail-status'>
														{mail.status === 'uncheck' ? <div className='mail-status-have'></div> : <div className='mail-status-check'></div>}
													</div>
												</div>
											</div>
										</div>
									</div>
								)
							:
								<div>
									Переписок ещё нет
								</div>
							}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
};

export default Account_Mail;