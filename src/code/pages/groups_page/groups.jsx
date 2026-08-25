import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../../../App.css';
import App_Router from '../../../app_router/app_router';
import { BrowserRouter } from 'react-router-dom';
import Searcher from '../../../components/searcher/search';
import axios from 'axios';
import Button_Default from '../../../components/buttons/button_default/button_default';
import Form_Creator_Group from '../../../components/group_creator_form/group_creator_form.jsx';
import Input_Default from '../../../components/inputs/input_default/input_default';
import Invites_Page from '../invites_page/invites_page.jsx';
import Notification_Bar from '../../../components/notification_bar/notification_bar.jsx';
 
export const Groups = ({current_group_id, set_current_group_id, my_id, return_my_groups, visiable_panel_with_invites, set_visiable_panel_with_invites, ws_message_type, my_name}) => {

	const [ groups, set_groups ] = useState([]);
	const [ default_groups, set_default_groups] = useState([]);

	const [ local_group, set_local_group] = useState([]); // локальное хранение groups (просто для справки)
	const [ my_local_group, set_my_local_group] = useState([]); // локальное хранение my_groups (просто для справки)
	const [ my_local_groups_where_i_have, set_my_local_groups_where_i_have ] = useState([]); // локальное хранение groups_where_i_have (просто для справки)

	const [ my_groups, set_my_groups ] = useState([]);
	const [ default_my_groups, set_default_my_groups] = useState([]);
	const [ my_groups_where_i_have, set_my_groups_where_i_have ] = useState([]);
	const [ default_my_groups_where_i_have, set_default_my_groups_where_i_have] = useState([]);

	const [ create_group_panel, set_create_group_panel ] = useState(false);
	const [ data_for_create_group, set_data_for_create_group ] = useState(null);
	const [ groups_profils_avatars, set_groups_profils_avatars ] = useState([]);
	const [ style_block, set_style_block ] = useState(true);
	const [ false_block, set_false_block ] = useState(false);
	const [ type_list_groups, set_type_list_groups ] = useState('all');
	const [ searcher_result, set_searcher_result ] = useState(true);

	// ЕСЛИ МОИ ГРУППЫ ЕСТЬ - ВОЗВРАЩАЕМ НАВЕРХ
	useEffect(()=>{
		if( default_my_groups.length > 0 ){
			return_my_groups(default_my_groups)
		}
	},[default_my_groups])

	function get_local_groups(){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		if( searcher_result ){
			set_local_group([]);
			set_my_local_group([]);
			set_my_local_groups_where_i_have([]);
			if( localStorage.getItem('groups_list') ){
				set_local_group(JSON.parse(localStorage.getItem('groups_list')));
			};
			// if( localStorage.getItem('my_groups_list') ){
			// 	const my_groups_list = JSON.parse(localStorage.getItem('my_groups_list'));
			// 	if( my_groups_list ){
			// 		try{
			// 			async function check_my_groups(){
			// 				const response = await axios.post('http://localhost:8080/check_my_groups', {
			// 					my_groups_list: my_groups_list, 
			// 				}, {
			// 					headers: {
			// 						Authorization: `Bearer ${token}`
			// 					}
			// 				});
			// 				if( response?.data?.my_groups ){
			// 					set_my_groups(response?.data?.my_groups);
			// 				}
			// 				else{
			// 					set_my_groups([]);
			// 				}
			// 			}
			// 		}
			// 		catch(err){
			// 			return console.error('Ошибка проверки моих групп: ', err);
			// 		}
			// 	}
			// };
			if( localStorage.getItem('my_groups_where_i_have_list')){
				set_my_local_groups_where_i_have(JSON.parse(localStorage.getItem('my_groups_where_i_have_list')));
			};
			console.log('get_local_groups')
			if( groups.length > 0 ){
				if( localStorage.getItem('groups_list') ){
					const exist_local_group = JSON.parse(localStorage.getItem('groups_list'));
					if( exist_local_group ){
						if( groups === exist_local_group ){
							// все локальные группы = загруженным
						}
						else{
							// локальные группы отличаются от загруженных, обновляем
							localStorage.removeItem('groups_list');
							localStorage.setItem('groups_list', JSON.stringify(groups));
						}
					};
				}
				else{
					localStorage.setItem('groups_list', JSON.stringify(groups));
				}
			}
			else {
				if( localStorage.getItem('groups_list') ){
					console.log('Загружаем список групп из localStorage');
					set_groups(JSON.parse(localStorage.getItem('groups_list')));
				}
			};
			if( my_groups.length > 0 ){
				if( localStorage.getItem('my_groups_list') ){
					const exist_local_group = JSON.parse(localStorage.getItem('my_groups_list'));
					if( exist_local_group ){
						if( my_groups === exist_local_group ){
							// мои локальные группы = загруженным
						}
						else{
							// локальные группы отличаются от загруженных, обновляем
							localStorage.removeItem('my_groups_list');
							localStorage.setItem('my_groups_list', JSON.stringify(my_groups));
						}
					};
				}
				else{
					localStorage.setItem('my_groups_list', JSON.stringify(my_groups));
				}
			}
			else {
				if( localStorage.getItem('my_groups_list') ){
					set_my_groups(JSON.parse(localStorage.getItem('my_groups_list')));
				}
			};
			if( my_groups_where_i_have.length > 0 ){
				if( localStorage.getItem('my_groups_where_i_have_list')){
					const exist_local_group_where_i_have = JSON.parse(localStorage.getItem('my_groups_where_i_have_list'));
					if( exist_local_group_where_i_have ){
						if( my_groups_where_i_have === exist_local_group_where_i_have ){
							// мои локальные группы = загруженным
						}
						else{
							// локальные группы отличаются от загруженных, обновляем
							localStorage.removeItem('my_groups_where_i_have_list');
							localStorage.setItem('my_groups_where_i_have_list', JSON.stringify(my_groups_where_i_have));
						}
					};
				}
			}
		}
		else {
			set_groups([]);
			set_my_groups([]);
			set_my_groups_where_i_have([]);
		}
	};

	useEffect(()=>{
		get_local_groups();
	},[])
	useEffect(()=>{
		get_local_groups();
	},[groups, my_groups, my_groups_where_i_have]);

	async function get_groups(){
		console.log('get_groups...')
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('http://localhost:8080/get_groups', {}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response.data?.message ){
				console.log(response.data?.message);
				console.log('Список групп: ', response.data?.my_groups || 'пусто');
				if( response?.data?.my_groups.length === 0 ){
					localStorage.removeItem('my_groups_list');
					set_my_local_group([]);
				};
				if( response.data?.groups && response.data?.my_groups ){
					const response_groups = response.data?.groups;
					if( response_groups.length > 0 ){
						response_groups.map(group => {
							const sett = group.group_settings;
							if( sett ){
								// console.log('sett = ', sett);
								const parsed_sett = JSON.parse(sett);
								if( parsed_sett ){
									group.group_settings = parsed_sett;
								};
								// console.log(group.group_settings)
							}
						});
					}
					console.log('response?.data = ', response?.data);
					set_groups(response.data?.groups);
					set_default_groups(response.data?.groups)

					set_my_groups(response.data?.my_groups);
					set_default_my_groups(response.data?.my_groups);
				};
				if( response.data?.groups_where_i_have ){
					set_my_groups_where_i_have(response.data?.groups_where_i_have);
					set_default_my_groups_where_i_have(response.data?.groups_where_i_have);
				}
			}
			else{
				console.log('пусто')
				localStorage.removeItem('groups_list');
				localStorage.removeItem('my_groups_list');
				localStorage.removeItem('my_groups_where_i_have_list');
				set_groups([]);
				set_default_groups([])

				set_my_groups([]);
				set_default_my_groups([]);

				set_my_groups_where_i_have([]);
				set_default_my_groups_where_i_have([]);
			}
		}
		catch(err){
			console.error('Ошибка: ', err);
		}
	};

	useEffect(()=>{
		// поиск групп...
		get_groups();
	},[])

	async function create_group(data){
		if( !data || data.group_name === '' ){
			return;
		};
		if( data.group_settings?.type_group === 'Закрытая' && data.group_settings?.password.length < 5 && data.group_settings?.password.trim() === '' && data.group_settings?.password.replace(' ').length < 1 ){
			return;
		}
		// создание новой группы...
		const token = localStorage.getItem('token');
		if( !token ){
			return console.error('Токен не обнаружен!');
		};
		const group_name = data.group_name; // name
		const group_img = data.group_img; // file
		const group_data = { // тут можно добавить всякое :)
			group_name: group_name,
			group_img: group_img,
			group_settings: JSON.stringify(data.group_settings),
		}
		if( group_name === ''){
			return;
		};
		if( group_data ){
			console.log('group_data = ', group_data)
		}
		const formdata = new FormData();
		formdata.append("group_name", group_data.group_name);
		formdata.append("group_img", group_data.group_img);
		formdata.append("group_settings", group_data.group_settings);

		if( !formdata ){
			console.log('Ошибка создания formdata')
		}
		try{
			const response = await axios.post('http://localhost:8080/create_group', formdata, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( !response.data?.refresh ){
				set_style_block(true)
			};
			if( response.data?.message ){
				console.log('Ответ от сервера /create_group: ', response.data?.message);
				set_data_for_create_group(null)
			}
			else{
				console.log(response.data?.error);
			};
			if( response.data?.refresh ){
				get_local_groups();
				set_style_block(true);
				get_groups();
			}
		}
		catch(err){
			console.error('Ошибка создания группы: ', err);
			set_false_block(true);
		}
	};

	async function remove_group(id){
		const token = localStorage.getItem('token');
		if( !token ){
			return console.error('Ошибка токена: Токен некорректный');
		};
		try{
			const response = await axios.post('http://localhost:8080/remove_group',{},{
				headers: {
					Authorization: `Bearer ${token}`,
					id: id,
				}
			});
			if( response.data?.message ){
				console.log('Ответ от сервера /remove_group: ', response.data?.message);
				// удаление из groups...
				const filtered_groups = groups.filter(g=>g._id !== id);
				if( filtered_groups.length > 0 ){
					set_groups(filtered_groups);
				};
				if( filtered_groups.length === 0 ){
					get_local_groups();
					localStorage.removeItem('groups_list');
					localStorage.removeItem('my_groups_list');
				}
			}
			else{
				console.log(response.data?.error);
			};
			if( response.data?.refresh ){
				get_local_groups();
				get_groups();
			}
		}
		catch(err){
			console.error('Ошибка удаления группы')
		}
	};

	// async function remove_all_groups(){
	// 	const token = localStorage.getItem('token');
	// 	if( !token ){
	// 		return console.error('Ошибка токена: Токен некорректный');
	// 	};
	// 	try{
	// 		const response = await axios.post('http://localhost:8080/remove_all_groups',{},{
	// 			headers: {
	// 				Authorization: `Bearer ${token}`,
	// 			}
	// 		});
	// 		if( response.data?.refresh ){
	// 			get_local_groups();
	// 			get_groups();
	// 		}
	// 	}
	// 	catch(err){
	// 		console.error('Ошибка удаления группы')
	// 	}
	// };
	// useEffect(()=>{
	// 	remove_all_groups();
	// },[])

	useEffect(()=>{
		if( data_for_create_group !== null ){
			console.log('Настройки для создания группы: ', data_for_create_group)
			create_group(data_for_create_group);

		};
	},[data_for_create_group]);

	async function get_groups_profils(){
		console.log('ВЫПОЛНЕНИЕ GET_GROUPS_PROFILS()')
		try{
			let profils = [];
			const files = (context) => context.keys().map(context);
			const imgs = files(require.context('../../../images/groups_profils/', false, /\.(jpg)$/));
			if( imgs.length > 0 ){
				imgs.map((o,i) => {
					const raw_name = o.split('/')[3].split('.');
					const name = raw_name[0] + '.' + raw_name[2];
					const o_data = {
						path: o,
						name: name,
					};
					profils.push(o_data);
				})
			};
			if( profils.length > 0 ){
				set_groups_profils_avatars(profils)
			}
		}
		catch(err){
			console.error('Ошибка получения изображений групп: ', err)
		};
	};

	useEffect(()=>{
		if( groups_profils_avatars.length > 0 ){
			groups_profils_avatars.map(g => console.log('g = ', g));
		}
	},[groups_profils_avatars]);

	useEffect(()=>{
		if( groups.length > 0 ){
			get_groups_profils();
		};
	},[groups]);

	async function join_group(id){
		await set_current_group_id(''); set_current_group_id(id);
	};

	return (
		<div className='groups'>
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
					<div className='groups-list-row'>
						<div className='groups-list-row-item' onClick={()=>{set_type_list_groups('all')}} style={{
							backgroundColor: type_list_groups === 'all' ? 'lightgray' : 'whitesmoke'
						}}>
							все группы
						</div>
						<div className='groups-list-row-item' onClick={()=>{set_type_list_groups('my')}} style={{
							backgroundColor: type_list_groups === 'my' ? 'lightgray' : 'whitesmoke'
						}}>
							мои группы
						</div>
						{my_groups_where_i_have.length > 0 &&
							<div className='groups-list-row-item' onClick={()=>{set_type_list_groups('my_added')}} style={{
								backgroundColor: type_list_groups === 'my_added' ? 'lightgray' : 'whitesmoke'
							}}>
								добавленные
							</div>
						}
					</div>
					<div>
						<Searcher
							value={type_list_groups === 'all' ? groups : my_groups}
							default_value={type_list_groups === 'all' ? default_groups : default_my_groups}
							set_value={type_list_groups === 'all' ? set_groups : set_my_groups}
							other={type_list_groups}
							other_func={get_local_groups}
							return_result={set_searcher_result}
						>
						</Searcher>
					</div>
					{/* список групп */}
					<div className='blocks'>
						<div className='block-item'>
							{groups.length === 0 &&
								<div className='group-empty-text'>
									ещё никто не создал группу, будь первым
								</div>
							}
						</div>
					</div>
					<div>
						{create_group_panel
						?
							<Form_Creator_Group
								set_create_group_panel={set_create_group_panel}
								set_data_for_create_group={set_data_for_create_group}
								style_block={style_block}
								set_style_block={set_style_block}
								false_block={false_block}
								set_false_block={set_false_block}
							>
							</Form_Creator_Group>
						:
							type_list_groups === 'my' &&
							<div className='create-group'>
								<Button_Default onClick={()=>{set_create_group_panel(true)}}>
									Создать группу
								</Button_Default>
							</div>
						}
					</div>
					<div className='blocks'>
						<div className='block-item'>
							{type_list_groups === 'all'
							?
								groups.length > 0 &&
									groups.map(g=>
										<div className='group-box' key={g._id} onClick={async () => {await join_group(g._id)}}>
											<div className='row'>
												<div className='group-img'>
													<img className='group-img-profil' src={groups_profils_avatars.find(o => o.name.toString() === g.group_img.toString())?.path} alt=""/>
												</div>
												<div className='group-name'>
													{g.group_name}
												</div>
												<div className='group-count-peoples'>
													{g.group_count ? g.group_count.length > 0 && g.group_count : '0'}
												</div>
											</div>
											<div className='group-type'>
												{g?.group_settings?.password !== '' && '*'}
											</div>
										</div>								
									)
							: 
								type_list_groups === 'my'
							?
								my_groups.length > 0 &&
									my_groups.map(g=>
										<div className='group-box' key={g._id} onClick={async () => {await join_group(g._id)}}>
											<div className='row'>
												<div className='group-img'>
													<img className='group-img-profil' src={groups_profils_avatars.find(o => o.name.toString() === g.group_img.toString())?.path} alt=""/>
												</div>
												<div className='group-name'>
													{g.group_name}
												</div>
												<div className='group-count-peoples'>
													{g.group_count ? g.group_count.length > 0 && g.group_count : '0'}
												</div>
											</div>
											<div className='group-type'>
												{g?.group_settings?.type_group === 'Закрытая' && '*'}
											</div>
										</div>								
									)
							: 	
								type_list_groups === 'my_added' &&
								my_groups_where_i_have.length > 0 &&
									my_groups_where_i_have.map(g=>
										<div className='group-box' key={g._id} onClick={async () => {await join_group(g._id)}}>
											<div className='row'>
												<div className='group-img'>
													<img className='group-img-profil' src={groups_profils_avatars.find(o => o.name.toString() === g.group_img.toString())?.path} alt=""/>
												</div>
												<div className='group-name'>
													{g.group_name}
												</div>
												<div className='group-count-peoples'>
													{g.group_count ? g.group_count.length > 0 && g.group_count : '0'}
												</div>
											</div>
											<div className='group-type'>
												{g?.group_settings?.type_group === 'Закрытая' && '*'}
											</div>
										</div>								
									)
							}
						</div>
					</div>
				</div>
					
			</div>
		</div>
	)
};

export default Groups;