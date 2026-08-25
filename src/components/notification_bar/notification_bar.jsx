import React, {useState, useEffect} from 'react';
import cl from './notification_bar.module.css';
import axios from 'axios';

export const Notification_Bar = ({type, ws_message_type, my_id, my_name}) => {
	// type = friends, mails, invites
	const token = localStorage.getItem('token');

	const [new_mails_count, set_new_mails_count] = useState(0);
	const [new_friends_count, set_new_friends_count] = useState(0);
	const [new_invites_count, set_new_invites_count] = useState(0);

	async function get_my_id(){
		if( !token ){ return };
		try{
			const response = await axios.post('http://localhost:8080/get_user_data', {

			}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.my_id ){
				return response?.data?.my_id
			};
		}
		catch(err){
			console.error('Ошибка получения id: ', err);
		}
	};

	async function get_notifications(){
		if( !token ){ return }
		const response = await axios.get('http://localhost:8080/get_notifications', {
			params: {
				type: type,
				my_id: my_id || await get_my_id() || 'пусто',
				my_name: my_name,
				ws_message_type: ws_message_type?.type || 'refresh',
			},
			headers: {
				Authorization: `Bearer ${token}`
			}
		});
		console.log('notifications = ', response)
		if( response?.data?.uncheck_mails_count > 0 ){
			// новые сообщения
			console.log('[+]')
			set_new_mails_count(response?.data?.uncheck_mails_count)
		}
		else{
			set_new_mails_count(0)
		};
		if( response?.data?.new_friends_count > 0 ) {
			// новые запросы в друзья
			console.log('[+][+]')
			set_new_friends_count(response?.data?.new_friends_count)
		}
		else{
			set_new_friends_count(0)
		};
		if( response?.data?.new_invites_count > 0 ){
			// новые приглашения
			console.log('[+][+][+]')
			set_new_invites_count(response?.data?.new_invites_count)
		}
		else{
			set_new_invites_count(0)
		}
	};

	useEffect(()=>{
		if( ws_message_type?.type === 'new_post_message' && ((ws_message_type?.for?.to === my_id) || (ws_message_type?.for?.from === my_id)) || (ws_message_type?.type === 'invite_in_group')){
			get_notifications(type);
			return;
		};
		if( (ws_message_type?.type === 'add_friend') || (ws_message_type?.type === 'remove_friend') || (ws_message_type?.type === 'cancel_add_friend') || (ws_message_type?.type === 'confirm_friend') || (ws_message_type?.type === 'cancel_confirm_friend') ){
			get_notifications(type);
			return;
		}
	},[ws_message_type])

	useEffect(()=>{
		//запуск при первом рендеринге
		get_notifications();
	},[])

	return (
		<div className={type === 'mails' ? new_mails_count > 0 ? `${cl.notification_bar}` : `${cl.notification_bar_empty}` : type === 'friends' ? new_friends_count > 0 ? `${cl.notification_bar}` : `${cl.notification_bar_empty}` : type === 'invites' && new_invites_count > 0 ? `${cl.notification_bar}` : `${cl.notification_bar_empty}`}>
			{type === 'mails' && 
				(new_mails_count > 0 && new_mails_count < 100) ? new_mails_count : new_mails_count > 100 && '99+'
			}
			{type === 'friends' &&
				(new_friends_count > 0 && new_friends_count < 100) ? new_friends_count : new_friends_count > 100 && '99+'
			}
			{type === 'invites' &&
				(new_invites_count > 0 && new_invites_count < 100) ? new_invites_count : new_invites_count > 100 && '99+'
			}
		</div>
	)
}

export default Notification_Bar;