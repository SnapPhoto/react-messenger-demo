import React, {useState, useEffect} from 'react';
import cl from './panel_with_push_user_in_group.module.css';
import axios from 'axios';
import Searcher from '../../components/searcher/search.jsx';

export const Panel_With_Push_User_In_Group = ({close, group_id, my_id, ws_ref}) => {

	const [ friends, set_friends ] = useState([]);
	const [ default_friends, set_default_friends ] = useState([]);
	const [ loading_friends, set_loading_friends ] = useState(false);
	const [ avatars, set_avatars ] = useState([]);
	const [ sended_invites, set_sended_invites ] = useState([]);

	// поиск друзей
	async function get_friends(){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			set_friends([]); // обнуление
			set_default_friends([]); // обнуление
			set_loading_friends(true);
			const response = await axios.post('/main/get_friends', {
				group_id: group_id
			}, {
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
					set_loading_friends(false);
				});
			}
			else{
				set_loading_friends(false);
			}
		}
		catch(err){
			console.error('Ошибка: ', err);
			set_loading_friends(false);
		}
	};
	useEffect(()=>{
		if( group_id ){
			get_friends()
		};
	},[group_id])

	useEffect(()=>{
		// очистка
		set_friends([]);
		set_default_friends([]);
	},[])

	// поиск аватарок пользователей
	useEffect(()=>{
		async function get_avatars(){
			try{
				let a = [];
				const Files = (context)=>context.keys().map(context);
				const images = await Files(require.context('../../images/profils', false, /\.(jpg)$/));
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
	},[default_friends]);

	async function send_invite_in_group(friend){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('/send_invite_in_group', {
				for_user: friend.id,
				from_user_id: my_id,
				invite_data: {
					id: group_id,
				}
			}, {
				headers: {
					Authorization: `Bearer ${token}`,
				}
			});
			if( response?.data?.message ){
				console.log('Приглашение отправлено!');
				get_invites();

				// прокидывание через websocket
				try{
					if( ws_ref.current !== null && ws_ref.current.readyState === 1 ){
						ws_ref.current.send(JSON.stringify({
							type: 'invite_in_group',
							group_id: group_id,
							for_user: friend.id,
							from_user_id: my_id,
						}));
					}
				}
				catch(err){
					throw err;
				}
			}
			else{
				console.log('Приглашение не отправлено');
			};
		}
		catch(err){
			return console.log('Ошибка: ', err);
		}
	};

	async function get_invites(){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('/get_invites', {
				group_id: group_id,
			}, {
				headers: {
					Authorization: `Bearer ${token}`,
				}
			});
			if( response?.data?.sended_invites ){
				console.clear()
				console.log('sended_invites = ', response?.data?.sended_invites);
				set_sended_invites(response?.data?.sended_invites);
			}
		}
		catch(err){
			return console.error('Ошибка: ', err);
		}
	}
	useEffect(()=>{
		get_invites();
	},[my_id, group_id])

// 	async function remove_all_invites(){
// 		try{
// 			const response = await axios.post('/remove_all_invites', {}, {
// 
// 			});
// 			if( response ){
// 				console.log('Удаление успешно!');
// 			}
// 		}
// 		catch(err){
// 			console.error('Ошибка удаления: ', err);
// 		}
// 	}
// 	useEffect(()=>{
// 		remove_all_invites()
// 	},[])

	return (
		<div className={cl.panel_with_push_user_in_group}>
			<div className={cl.row}>
				<div className={cl.button} onClick={()=>{close()}}>
					Закрыть
				</div>
			</div>
			<Searcher
				value={friends.length}
				set_value={set_friends}
				default_value={default_friends}
			></Searcher>
			<div className='split'>
				{/* разделитель */}
			</div>
			<div className={cl.panel}>
				{friends.map((friend, index) =>
					<div className='people' key={index}>
						<div className='people-data'>
							<div className='row'>
								<div>
									{friend.avatar 
									?
										<div className='people-icon-true'>
											<img className="icon"src={avatars.find(a=>a.name === friend.avatar)?.path}/>
										</div>
									:
										<div className='people-icon-false'>
											
										</div>
									}
								</div>
								<div className='people-name'>
									{friend.name}
								</div>
								{sended_invites.some(invite => invite?.id_for === friend?.id && invite?.invite_data?.id === group_id)
								?
									<div className={cl.button_mini}>
										отправлено
									</div>
								:
									<div className={cl.button_mini} onClick={()=>{send_invite_in_group(friend)}}>
										пригласить
									</div>
								}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default Panel_With_Push_User_In_Group;