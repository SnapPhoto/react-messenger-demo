import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useParams, useNavigate} from 'react-router-dom';
import '../../../App.css';
import App_Router from '../../../app_router/app_router';
import { BrowserRouter } from 'react-router-dom';
import Input_Default from '../../../components/inputs/input_default/input_default';
import Button_Default from '../../../components/buttons/button_default/button_default';
import Loader from '../../../components/loader/loader';
import axios from 'axios';
import User_Events from '../../../components/user_events/user_events.jsx';
import Form_Create_New_Record_For_User_Page from '../../../components/form_create_new_record_for_user_page/form_create_new_record_for_user_page.jsx';
import Content_Block from '../../../components/content/content.jsx';
import Settings_Panel_User_Page from '../../../components/settings_panel_user_page/settings_panel_user_page.jsx';
import Panel_With_Hidden_Posts_For_User_Page from '../../../components/panel_with_hidden_posts_for_user_page/panel_with_hidden_posts_for_user_page.jsx';
import User_Page_More_Groups_Panel from '../../../components/user_page_more_groups_panel/user_page_more_groups_panel';
import User_Page_More_Friends_Panel from '../../../components/user_page_more_friends_panel/user_page_more_friends_panel';
import Invites_Page from '../invites_page/invites_page.jsx';
import View_For_Images from '../../../components/view_for_images/view_for_images.jsx';
import Arhiv from '../../../components/arhiv/arhiv.jsx';
import Notification_Bar from '../../../components/notification_bar/notification_bar.jsx';

function normalize_user_post_images(images){
	let value = images;
	if( typeof value === 'string' ){
		try { value = JSON.parse(value); } catch { return []; }
	}
	if( !Array.isArray(value) ) return [];
	const result = [];
	for( const entry of value ){
		let parsed = entry;
		if( typeof parsed === 'string' ){
			try { parsed = JSON.parse(parsed); } catch { continue; }
		}
		for( const item of Array.isArray(parsed) ? parsed : [parsed] ){
			if( typeof item === 'string' ){
				try {
					const decoded = JSON.parse(item);
					result.push(...(Array.isArray(decoded) ? decoded : [decoded]));
				} catch { continue; }
			}
			else if( item && typeof item === 'object' ) result.push(item);
		}
	}
	return result;
}

export const User_Page = ({raw_user, raw_curr_user, my_id, set_current_group_id, token, set_s_user, visiable_panel_with_invites, set_visiable_panel_with_invites, ws_message_type, ws_ref, my_name, all_notifications}) => {
	const [user, set_user] = useState(null);
	const [curr_user, set_curr_user] = useState(null);

	const navigate = useNavigate();

	const [t, set_t] = useState();
	const [avatars, set_avatars] = useState([]);
	const [this_my_page, set_this_my_page] = useState(false);

	const [ my_groups, set_my_groups ] = useState([]);
	const [ groups_profils_avatars, set_groups_profils_avatars ] = useState([]);
	const [ visiable_panel_with_more_groups, set_visiable_panel_with_more_groups ] = useState(false);
	const [ visiable_panel_with_more_friends, set_visiable_panel_with_more_friends ] = useState(false);

	const [friends, set_friends] = useState([]); // друзья
	const [default_friends, set_default_friends] = useState([]);
	const [is_loading_friends, set_is_loading_friends] = useState(false);
	const [selected_user, set_selected_user] = useState(null);

	useEffect(()=>{
		if( raw_user ){
			console.log('raw_user = ', raw_user);
		};
		if( raw_curr_user ){
			console.log('raw_curr_user = ', raw_curr_user);
		}
	},[raw_user, raw_curr_user])

	const [visiable_panel_events, set_visiable_panel_events] = useState(false);

	const [page_data, set_page_data] = useState([]);
	const [is_friend, set_is_friend] = useState(false);

	const [posts, set_posts] = useState([]);
	const [default_posts, set_default_posts] = useState([]);

	const [posts_images, set_posts_images] = useState([]);
	const [require_images, set_require_images] = useState(false);

	// данные формы для создания нового поста
	const [visiable_form, set_visiable_form] = useState(false);
	const [visiable_settings_user_page, set_visiable_settings_user_page] = useState(false);
	const [visiable_panel_with_hidden_post ,set_visiable_panel_with_hidden_post] = useState(false);
	const [visiable_user_images, set_visiable_user_images] = useState(false);

	// для просмотра фоток
	const [ visiable_view_for_images, set_visiable_view_for_images ] = useState(false);
	const [ type_arhiv, set_type_arhiv ] = useState('top'); // для порядка изображений
	const [ current_img_for_view, set_current_img_for_view ] = useState(null);
	const [ normal_images, set_normal_images ] = useState([]);
	const [ new_images_array, set_new_images_array ] = useState([]);
	const [ visible_images, set_visible_images ] = useState([]); // видимые изображения для view_for_images.js
	const [ hidden_images, set_hidden_images ] = useState([]); // скрытые изображения для view_for_images.js

	// ищу данные профиля
	const { user_id } = useParams();

	console.log('] user = ', user);
	console.log('] my_id = ', my_id);
	console.log('] user_id = ', user_id)

	async function get_info_friend_or_not(){
		if( !user_id ){return}
		// поиск данных, друг или нет
		const token = localStorage.getItem('token');
		if( !token ){
			return console.error('Ошибка токена');
		};
		try{
			const response = await axios.post('/get_info_friend_or_not', {
				user_id: user_id,
			},{
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if (response?.data?.i_is_friend === 'friend'){
				set_is_friend('friend');
			}
			else if(response?.data?.i_is_friend === 'no'){
				set_is_friend('no');
			}
			else if( response?.data?.i_is_friend === 'in_process'){
				set_is_friend('in_process');
			}
			else if( response?.data?.i_is_friend === 'need_to_add' ){
				set_is_friend('need_to_add');
			}
		}
		catch(err){
			return console.error('Ошибка: ', err);
		};
	}

	useEffect(()=>{
		if( user_id ){
			get_user_page_data(user_id);
			set_posts([]); 
			get_posts();
			set_require_images(true);
			if( my_id === user_id ){
				set_this_my_page(true);
			}
			else{
				set_this_my_page(false);
			};
			// поиск данных, друг или нет
			get_info_friend_or_not();
		}
	},[user_id, my_id])

	async function get_posts(){
		if( !user_id ){return}
		const token = localStorage.getItem('token');
		if( !token || !user_id ){
			return;
		};
		try{
			const response = await axios.post('/get_user_page_posts', {
				user_page_id: user_id,
			}, {
				headers: {
					Authorization: `Bearer ${token}`,
				}
			});
			if( response?.data?.message ){
				console.log(response?.data?.message);
				console.log('Полученые посты: ',response?.data?.posts);
				set_posts(response?.data?.posts);
				set_default_posts(response.data?.posts);
			}
			else{ set_posts([]); set_default_posts([]) }
		}
		catch(err){
			console.error('Ошибка: ', err);
		}
	};

	async function get_user_page_data(user_id){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		if( user_id === null || !user_id ){
			return console.log('user_id = ', user_id);
		};
		console.log('my_id = ', my_id)
		try{
			const response = await axios.post('/get_user_page_data', {
				user_id: user_id || 'ПУСТО',
			}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.message === 'Данные получены'){
				console.log('Данные получены', response?.data?.user_data)
				set_user(response?.data?.user_data);
				if( response?.data?.page_data){
					set_page_data(response?.data?.page_data);
					console.log('page_data = ', response?.data?.page_data);
					if( response?.data?.my_page ){
						set_this_my_page(true);
					}
					else {
						set_this_my_page(false);
					}
				}
			}
			else{
				console.log('Данные не получены')
			}
		}
		catch(err){
			return console.error('Ошибка получения даных страницы: ', err);
		}
	}

	async function get_avatars(){
		const token = localStorage.getItem('token');
		if( token ){
			try{
				const files_context = (context)=>context.keys().map(context);
				const files = files_context(require.context('../../../../src/images/profils', false, /\.(jpg)$/));
				if( files.length > 0 ){
					let avatars_data = [];
					files.map(avatar => {
						const path = avatar;
						const raw_name = path.split('/')[3].split('.');
						const name = raw_name[0] + '.' + raw_name[2];
						const avatar_data = {
							path: path,
							name: name,
						};
						avatars_data.push(avatar_data);
					});
					if( avatars_data.length > 0 ){
						set_avatars(avatars_data);
					}
				} 
			}
			catch(err){
				return console.error('Ошибка: ', err);
			}
		}
	};
	useEffect(()=>{
		get_avatars();
	},[])

	useEffect(()=>{
		if( user ){
			let raw_time = user.last_activity;
			let n_d = Date.now();
			let raw_time_ms = new Date(raw_time).getTime();
			let time_ago = n_d - raw_time_ms;

			let f_time_s = Math.floor(time_ago / 1000);

			let d = 0;
			let h = Math.floor(f_time_s / 3600);
			let m = Math.floor((f_time_s % 3600) / 60);
			let s = f_time_s % 60;

			while (h >= 24){
			    d += 1;
			    h -= 24;
			}

			set_t({
				d: d,
				h: h,
				m: m,
				s: s,
			})
		}
	},[user]);

	function close_form(){
		set_visiable_form(false)
	};

	useEffect(()=>{
		const files = posts.flatMap(post => {
			let images = post?.images;
			if( typeof images === 'string' ){
				try { images = JSON.parse(images); } catch { images = []; }
			}
			return Array.isArray(images) ? images : [];
		});
		const unique_names = new Set();
		const entries = files.flatMap(entry => {
			let decoded = entry;
			if( typeof decoded === 'string' ){
				try { decoded = JSON.parse(decoded); } catch { return []; }
			}
			return Array.isArray(decoded) ? decoded : [decoded];
		});
		const current_images = entries.flatMap(data => {
			const loaded = data?.data?.loaded_file || data?.loaded_file;
			const filename = loaded?.full_name || loaded?.name;
			if( !filename || unique_names.has(filename) ) return [];
			unique_names.add(filename);
			return [{
				name: loaded?.file_name || filename,
				full_name: filename,
				file_name: loaded?.file_name || filename,
				path: `/user-page-images/${encodeURIComponent(user_id)}/${encodeURIComponent(filename)}`,
			}];
		});
		set_posts_images(current_images);
		set_require_images(false);
	},[posts, user_id]);

	useEffect(()=>{
		get_posts()
		set_require_images(true)
	},[]);

	async function remove_all_post_user_page(){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('/remove_all_posts_in_user_page', {
				user_page_id: user_id,
			}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response.data?.refresh ){
				console.log('Со страницы удалены все посты');
				get_posts();
				get_user_page_data();
			}
		}
		catch(err){
			return console.error('Ошибка удаления: ', err);
		}
	};
	// useEffect(()=>{
	// 	remove_all_post_user_page();
	// },[])

	function open_settings_user_page(){
		set_visiable_settings_user_page(true);
	};

	async function get_groups(){
		if( !user_id ){
			return;
		};
		set_my_groups([]);
		console.log('get_groups...')
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		if( this_my_page ){
			// поиск моих групп
			try{
				const response = await axios.post('/get_groups', {
					user_page_id: user_id,
				}, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});
				if( response.data?.message ){
					console.log(response.data?.message);
					console.log('Список групп: ', response.data?.my_groups || 'пусто');
					if( response.data?.my_groups ){
						const raw_my_groups = response.data?.my_groups;
						raw_my_groups.forEach(group => {
							set_my_groups(my_groups => [...my_groups, group])
						})
					};
					if( response.data?.groups_where_i_have ){
						const raw_groups_where_i_have = response.data?.groups_where_i_have;
						raw_groups_where_i_have.forEach(group => {
							set_my_groups(my_groups => [...my_groups, group])
						})
					}
				}
				else{
					localStorage.removeItem('my_groups_list');
					set_my_groups([]);
				}
			}
			catch(err){
				console.error('Ошибка: ', err);
			}
		}
		else {
			// поиск групп другого пользователя
			console.log('поиск групп другого пользователя')
			try{
				const response = await axios.post('/get_groups', {
					user_page_id: user_id,
				}, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});
				if( response.data?.message ){
					console.log(response.data?.message);
					console.log('Список групп: ', response.data?.my_groups || 'пусто');
					if( response.data?.my_groups ){
						const raw_my_groups = response.data?.my_groups;
						raw_my_groups.forEach(group => {
							set_my_groups(my_groups => [...my_groups, group])
						})
					};
					if( response.data?.groups_where_i_have ){
						const raw_groups_where_i_have = response.data?.groups_where_i_have;
						raw_groups_where_i_have.forEach(group => {
							set_my_groups(my_groups => [...my_groups, group])
						})
					}
				}
				else{
					localStorage.removeItem('my_groups_list');
					set_my_groups([]);
				}
			}
			catch(err){
				console.error('Ошибка: ', err);
			}
		}
	};

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

	async function join_group(id){
		await set_current_group_id(''); set_current_group_id(id);
	};

	async function get_friends(){
		if( !user_id ){return}

		set_friends([])
		set_is_loading_friends(true);
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('/main/get_friends', {
				this_my_page: this_my_page,
				user_page_id: user_id,
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

	function set_current_user(user){
		set_selected_user(null);
		set_selected_user(user);
	};

	useEffect(()=>{
		if( selected_user !== null ){
			set_s_user(selected_user);
		}
	},[selected_user]);

	function disable_scrolling_page(){
		document.body.style.overflow = 'hidden';
		document.body.style.height = '100vh';
	};

	function enable_scrolling_page(){
		document.body.style.overflow = '';
	}

	useEffect(()=>{
		// очистка друзей
		set_friends([]);
		// подгрузка изображений аватарок групп
		get_groups_profils();
		set_visiable_panel_with_more_friends(false);
		set_visiable_panel_with_more_groups(false);
	},[])
	useEffect(()=>{
		if( user_id ){
			set_visiable_panel_with_more_friends(false);
			set_visiable_panel_with_more_groups(false);
			// поиск друзей
			get_friends();
			// поиск групп...
			get_groups();
		}
	},[user_id])

	async function confirm_friend(id){
		if( !user_id ){return}

		const token = localStorage.getItem('token');
		if( !token ){
			return console.error('Токен не обнаружен');
		};
		if( token ){
			try{
				const response = await axios.post('/main/confirm_friend', {}, {
					headers: {
						Authorization: `Bearer ${token}`,
						confirm_id: id,
					}
				});
				if( response ){
					get_info_friend_or_not()

					// так же обновить через websocket
					try{
						if( ws_ref.current !== null && ws_ref.current.readyState === 1 ){
							ws_ref.current.send(JSON.stringify({
								type: 'confirm_friend',
								for: user_id,
								my_id: my_id,
							}))
						}
					}
					catch(err){
						throw err;
					}
				}
			}
			catch(err){
				return console.error('Ошибка принятия в друзья: ', err)
			}
		}
	};


	async function cancel_confirm(id){
		if( !user_id ){return}

		const token = localStorage.getItem('token');
		if( !token ){
			return console.error('Токен не обнаружен');
		};
		if( token ){
			try{
				const response = await axios.post('/main/cancel_confirm_friend', {}, {
					headers: {
						Authorization: `Bearer ${token}`,
						cancel_confirm_id: id,
					}
				});
				if( response ){
					get_info_friend_or_not()

					// так же обновить через websocket
					try{
						if( ws_ref.current !== null && ws_ref.current.readyState === 1 ){
							ws_ref.current.send(JSON.stringify({
								type: 'cancel_add_friend',
								for: user_id,
								my_id: my_id,
							}))
						}
					}
					catch(err){
						throw err;
					}
				}
			}
			catch(err){
				return console.error('Ошибка отмены запроса: ', err)
			}
		}
	};


	async function remove_friend(id){
		if( !user_id ){return}

		const token = localStorage.getItem('token');
		if( !token ){
			return console.error('Токен не обнаружен');
		};
		if( token ){
			try{
				const response = await axios.post('/main/remove_friend', {}, {
					headers: {
						Authorization: `Bearer ${token}`,
						remove_id: id,
					}
				});
				if( response ){
					if( response.data?.refresh === true ){
						get_info_friend_or_not()

						// так же обновить через websocket
						try{
							if( ws_ref.current !== null && ws_ref.current.readyState === 1 ){
								ws_ref.current.send(JSON.stringify({
									type: 'remove_friend',
									for: user_id,
									my_id: my_id,
								}))
							}
						}
						catch(err){
							throw err;
						}
					}
				}
			}
			catch(err){
				return console.error('Ошибка удаления пользователя из друзей: ', err)
			}
		}
	};

	async function add_friend(id){
		if( !user_id ){return}

		const token = localStorage.getItem('token');
		if( !token ){
			return console.error('Токен не обнаружен');
		};
		if( id ){
			try{
				const response = await axios.post('/main/add_friend', {}, {
					headers: {
						people_id: id,
						Authorization: `Bearer ${token}`
					}
				});
				if( response ){
					get_info_friend_or_not()

					// так же обновить через websocket
					try{
						if( ws_ref.current !== null && ws_ref.current.readyState === 1 ){
							ws_ref.current.send(JSON.stringify({
								type: 'add_friend',
								for: user_id,
								my_id: my_id,
							}))
						}
					}
					catch(err){
						throw err;
					}
				};
			}
			catch(err){
				console.error('Ошибка: ', err);
			}
		}
	};

	useEffect(()=>{
		set_normal_images(posts_images);
	},[posts_images]);

	useEffect(()=>{
		const filename_of = value => typeof value === 'string' ? value.split(/[\\/]/).pop() : '';
		const next_images = [];
		for( const post of posts.slice().reverse() ){
			for( const image of normalize_user_post_images(post?.images) ){
				const loaded = image?.data?.loaded_file || image?.loaded_file || {};
				const names = [loaded.name, loaded.file_name, loaded.full_name, loaded.path, loaded.file_path].map(filename_of).filter(Boolean);
				if( names.length === 0 ) continue;
				const asset = normal_images.find(item => [item.name, item.file_name, item.full_name, item.path].some(value => names.includes(filename_of(value))));
				if( !asset ) continue;
				next_images.push({path: asset.path, name: asset.full_name || asset.name || names[0], hide: post?.hide, index: next_images.length});
			}
		}
		set_new_images_array(next_images);
	},[posts, normal_images]);

	useEffect(()=>{
		const is_hidden = value => value === true || value === 'true';
		set_visible_images(new_images_array.filter(image => !is_hidden(image?.hide)).map((image,index)=>({...image,index})));
	},[new_images_array]);

	useEffect(()=>{
 		if( visible_images.length > 0 ){
 			console.log('_____________] visible_images = ', visible_images)
 		}
	},[visible_images])

	useEffect(()=>{
		if( hidden_images.length > 0 ){
			console.log('_____________] hidden_images = ', hidden_images)
		}
	},[hidden_images])

	async function add_favourites(type){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const content = {
				type: type,
				id: user_id,
				data: {
					img_path: avatars.find(avatar => avatar.name === user?.avatar)?.path,
				} || null,
			}
			console.log('content = ', content)
			const response = await axios.post('/add_favourites', {
				content: content,
			}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.message ){
				console.log('Сервер вернул сообщение: ', response?.data?.message)
			};
			if( response?.data?.refresh ){
				//обновление
			};
			if( response?.data?.error ){
				console.error('Сервер вернул ошибку: ', response?.data?.error);
			};
		}	
		catch(err){
			return console.error('Ошибка добавления в избранное: ', err);
		}
	};

	useEffect(()=>{
		const user_avatar_img_path = avatars.find(avatar => avatar.name === user?.avatar)?.path;
		const user_data_for_favourite = {
			img_path: user_avatar_img_path,
			user_id: user_id,
			user_name: user?.name,
		}
	},[avatars, user]);

	useEffect(()=>{
		if( ws_message_type?.for && (ws_message_type?.from === user_id || ws_message_type?.for === user_id)){
			get_info_friend_or_not();
		};
		if( ws_message_type?.user_id && ws_message_type?.my_id === user_id ){
			get_info_friend_or_not();
		};
	},[ws_message_type])

	useEffect(()=>{
		if( all_notifications !== undefined ){
			console.log('all_notifications = ', all_notifications)
		}
	},[all_notifications])

	async function check_online(){
		let loading = false;
		try{
			loading = true;
			//запрос на сервер...
			if( loading ){
				const response = await axios.get('/check_online', {
					params: {
						user_id: user_id,
					},
					headers: {
						Authorization: `Bearer ${token}`
					}
				});
				if( response?.body?.my_online !== undefined ){
					console.log('Я В СЕТИ ?', response?.data?.my_online)
				};
				if( response?.body?.other_online !== undefined ){
					console.log('В СЕТИ ?', response?.data?.other_online)
				};
			}
			else {
				loading = false;
				return;
			}
		}
		catch(err){
			console.error('Ошибка: ', err);
		}
		return () => {
			loading = false;
		};
	};

	useEffect(()=>{
		check_online().catch(console.error);
	},[user_id])

	return (
		<div className='user-page'>
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
					{visiable_user_images &&
						<Arhiv
							posts={posts}
							images={normal_images}
							close={()=>set_visiable_user_images(false)}
							open_view={()=>set_visiable_view_for_images(true)}
							set_current_img_for_view={set_current_img_for_view}
							return_type_arhiv={set_type_arhiv}
						/>
					}
					{visiable_panel_with_invites &&
						<Invites_Page
							user_id={user_id}
							close={()=>{set_visiable_panel_with_invites(false)}}
							avatars={avatars}
							get_avatars={get_avatars}
						></Invites_Page>
					}
					{visiable_view_for_images &&
						<View_For_Images
							images={new_images_array}
							current_img={current_img_for_view}
							close={()=>{set_visiable_view_for_images(false)}}
							type_arhiv={type_arhiv}
							visible_images={visible_images}
							hidden_images={hidden_images}
							hidden_posts={'false'}
							type_view={visiable_panel_with_hidden_post ? 'hidden' : 'visible'}
						></View_For_Images>
					}
					{user
					?	
						<div>
							{visiable_panel_with_more_friends &&
								<User_Page_More_Friends_Panel
									disable_scrolling_page={disable_scrolling_page}
									close={()=>{set_visiable_panel_with_more_friends(false)}}
									avatars={avatars}
									set_current_user={set_curr_user}
									friends={friends}
								></User_Page_More_Friends_Panel>
							}
							{visiable_panel_with_more_groups &&
								<User_Page_More_Groups_Panel
									groups={my_groups}
									groups_profils_avatars={groups_profils_avatars}
									join_group={join_group}
									close={()=>{set_visiable_panel_with_more_groups(false)}}
									disable_scrolling_page={disable_scrolling_page}
									enable_scrolling_page={enable_scrolling_page}
								>	
								</User_Page_More_Groups_Panel>
							}
							{visiable_panel_with_hidden_post &&
								<Panel_With_Hidden_Posts_For_User_Page
									close={()=>{set_visiable_panel_with_hidden_post(false)}}
									posts={posts}
									posts_images={posts_images}
									get_posts={get_posts}
									user_id={user_id}
									this_my_page={String(user_id) === String(my_id)}
									visible_images={visible_images}
									set_current_img_for_view={set_current_img_for_view}
									new_images_array={new_images_array}
									hidden_images={hidden_images}
									set_visiable_view_for_images={set_visiable_view_for_images}
								>	
								</Panel_With_Hidden_Posts_For_User_Page>
							}
							{/* {this_my_page ? 'Это моя страница' : 'Это страница другого пользователя'} */}
							<div className='row'>
								<div className='blocks avatar'>
									<div className='block-item'>
										<div className='user-avatar'>
											<img src={avatars.find(avatar => avatar.name === user.avatar)?.path}/>
										</div>
									</div>
								</div>
								<div className='split'>
									{/* разделитель */}
								</div>
								<div className='blocks name'>
									<div className='block-item'>
										{!this_my_page
											&&
												<div className='online'>
													{user?.online ? 'В сети' : 'Не в сети'}
												</div>
										}
										<div className='user-name row'>
											{user.name ? user.name : 'имя не указано'} 
											{!visiable_settings_user_page && this_my_page &&
												<div className='settings-button-user-page' onClick={()=>{open_settings_user_page()}}>
													Настройки
												</div>
											}
											{visiable_settings_user_page &&
												<div className='settings_panel_user_page'>
													<Settings_Panel_User_Page
														this_my_page={this_my_page}
														user_page_id={user_id}
														user={user}
														posts={posts}
														close_panel={()=>{set_visiable_settings_user_page(false)}}
														set_visiable_panel_with_hidden_post={set_visiable_panel_with_hidden_post}
													>	
													</Settings_Panel_User_Page>
												</div>
											}
										</div>
										<div className='user-email'>
											{user.email ? user.email : 'email не указан'}
										</div>
										<div className='user-t-number'>
											{user.t_number ? user.t_number : 'телефон не указан'}
										</div>
									</div>
								</div>
							</div>
							{/* основное тело (кнопки)*/}
							{this_my_page
							?
								<div>
									<div className='blocks'>
										<div className='block-item'>
											<div className='row-center'>
												<div className='user_page_button' onClick={()=>set_visiable_user_images(true)}>
													Изображения ({visible_images.length})
												</div>
											</div>
										</div>
									</div>
									{posts.length > 0 &&
										<div className='blocks'>
											<div className='block-item'>
												<div className='row-center'>
													<div className='user_page_button' onClick={()=>{set_visiable_form(true)}}>
														Добавить новую запись
													</div>
												</div>
											</div>
										</div>
									}
								</div>
							:
								<div className='p_r'>
									<User_Events
										buttons={[				// ДОРАБОТАТЬ!!!
											!this_my_page && 
												{text: 'Заблокировать', func: ()=>{}, vis: true},
											!this_my_page && 
												{text: 'Разблокировать', func: ()=>{}, vis: false},
											!this_my_page && 
												{text: 'Добавить в избранное', func: ()=>{add_favourites('user_page')}, vis: true},
											!this_my_page && 
												{text: 'Убрать из избранного', func: ()=>{}, vis: false},
											!this_my_page && 
												{text: 'Пожаловаться', func: ()=>{}, vis: true},
										]}
										visiable={visiable_panel_events}
										set_visiable={set_visiable_panel_events}
									></User_Events>
									<div className='blocks'>
										<div className='block-item'>
											<div className='row'>
												<div className='block-item'>
													{is_friend === 'friend'
													?
														<div className='user_page_button cancel_add_friend_button' onClick={()=>{remove_friend(user_id)}}>
															Удалить из друзей
														</div>
													:
														is_friend === 'in_process'
														?
															user_id === my_id ?
																<div className='user_page_button add_friend_button' onClick={()=>{confirm_friend(user_id)}}>
																	Принять заявку
																</div>
															:
																<div className='user_page_button cancel_confirm_friend_button' onClick={()=>{cancel_confirm(user_id)}}>
																	Отменить заявку
																</div>
														: 
															is_friend === 'no' ?
																<div className='user_page_button add_friend_button' onClick={()=>{add_friend(user_id)}}>
																	Добавить в друзья
																</div>
															: 	
																is_friend === 'need_to_add' &&
																<div className=''> 
																	<div className='user_page_button add_friend_button' onClick={()=>{confirm_friend(user_id)}}>
																		Принять заявку 
																	</div>
																	<div className='user_page_button cancel_confirm_friend_button' onClick={()=>{cancel_confirm(user_id)}}>
																		Отменить заявку
																	</div>
																</div>
																
													}
												</div>
												{is_friend &&
													<div className='split'>
														{/* разделитель */}
													</div>
												}
												{/* <div className='block-item'> */}
												{/* 	<div className='user_page_button'> */}
												{/* 		Друзья */}
												{/* 	</div> */}
												{/* </div> */}
												<div className='block-item'>
													<div className='user_page_button' onClick={()=>{set_visiable_panel_events(true)}}>
														Действия
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								
							}
							{this_my_page
							?		
								// МОЯ СТРАНИЦА (тело)
								<div className='row'>
									<div className='col-7'>
										<div className='block'>
											<div className='block-item'>
												<div className='user_page_body_content'>
													{posts.length > 0 && posts.some(p=>p.hide !== true && p.hide !== 'true')
														?
															posts.slice().reverse().map((post, index) =>
																post.hide !== true && post.hide !== 'true' &&
																	<div key={index} className='blocks'>
																		<div className='block-item'>
																			<Content_Block
																				// types: [img],[text],[img_and_text]
																				type={post?.type_post} 
																				role={'admin'}
																				img={post?.images || null}
																				text={post?.text}
																				visiable={true}
																				posts_images={posts_images}
																				id={post?._id}
																				group_id={undefined}
																				user_id={user_id}
																				refresh_posts={get_posts}
																				date={post?.date}
																				changed={post?.changed}
																				hidden={post?.hide}
																				this_my_page={String(user_id) === String(my_id)}
																				this_user_page={true}
																				set_current_img_for_view={set_current_img_for_view}
																				set_visiable_view_for_images={()=>{set_visiable_view_for_images(true)}}
																				new_images_array={new_images_array}
																				visible_images={visible_images}
																				hidden_images={hidden_images}
																				unique_token={post?.unique_token}
																			></Content_Block>
																		</div>
																	</div>
															)
														:
															<div className='all-tac fill-fon'>
																<div>
																	Записей нет.
																</div>
																<div className='split'>
																	{/* разделитель */}
																</div>
																<div className='button_create' onClick={()=>{set_visiable_form(true)}}>
																	Создать
																</div>
															</div>
													}
												</div>
											</div>
										</div>
									</div>
									<div className='split'>
										{/* разделитель */}
									</div>
									<div className='col-3'>
										{/* подтверждённые друзья */}
										{friends.length > 0 && friends.length < 5
										?
											<div className='blocks'>
												<div className='block-item'>
													<div className='user_page_friends'>
														Друзья
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
																</div>
															</div>
														</div>
													)}
												</div>
											</div>
										: 
											friends.length > 5 &&
											<div className='blocks'>
												<div className='block-item'>
													<div className='user_page_friends'>
														Друзья
													</div>
													{friends.map((friend, index) =>
														index < 4  &&
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
																</div>
															</div>
															<div className='user_page_button' onClick={()=>{set_visiable_panel_with_more_friends(true)}}>
																Ещё
															</div>
														</div>
													)}
												</div>
											</div>
										}
										<div className='blocks'>
											<div className='block-item'>
												<div className='user_page_my_group_panel'>
													{my_groups.length > 0 && my_groups.length < 5 
														?	
															<div className='user_page_my_group_panel_panel_collumn'>
																<div className='user_page_my_group_panel_panel_my_groups'>
																	Группы
																</div>
																<div className='user_page_my_group_panel_panel_collumn_groups'>
																	{my_groups.map((g, index)=>
																		index < 5 &&
																		<div className='group-box' key={g._id} onClick={async () => {await join_group(g._id)}}>
																			<div className='row'>
																				<div className='group-img'>
																					<img className='group-img-profil' src={groups_profils_avatars.find(o => o.name.toString() === g.group_img.toString())?.path} alt=""/>
																				</div>
																				<div className='group-name'>
																					{g.group_name}
																				</div>
																			</div>
																			<div className='group-type'>
																				{g?.group_settings?.type_group === 'Закрытая' && '*'}
																			</div>
																		</div>								
																	)}
																</div>
															</div>
														: 
															my_groups.length > 5 &&
															<div className='user_page_my_group_panel_panel_collumn'>
																<div className='user_page_my_group_panel_panel_my_groups'>
																	Группы
																</div>
																<div className='user_page_my_group_panel_panel_collumn_groups'>
																	{my_groups.map((g, index)=>
																		index < 4 &&
																		<div className='group-box' key={g._id} onClick={async () => {await join_group(g._id)}}>
																			<div className='row'>
																				<div className='group-img'>
																					<img className='group-img-profil' src={groups_profils_avatars.find(o => o.name.toString() === g.group_img.toString())?.path} alt=""/>
																				</div>
																				<div className='group-name'>
																					{g.group_name}
																				</div>
																			</div>
																			<div className='group-type'>
																				{g?.group_settings?.type_group === 'Закрытая' && '*'}
																			</div>
																		</div>								
																	)}
																	<div className='user_page_button' onClick={()=>{set_visiable_panel_with_more_groups(true)}}>
																		Ещё
																	</div>
																</div>
															</div>
													}
												</div>
											</div>
										</div>
									</div>
								</div>
							:
								// СТРАНИЦА ДРУГОГО ПОЛЬЗОВАТЕЛЯ (тело)
								<div className='row'>
									<div className={(friends.length > 0 || my_groups > 0) ? 'col-7' : 'col-10'}>
										<div className='blocks'>
											<div className='block-item'>
												<div className='user_page_body_content'>
													{posts.length > 0
														?
															posts.slice().reverse().map((post, index) =>
																post.hide !== true && post.hide !== 'true' &&
																	<div key={index} className='blocks'>
																		<div className='block-item'>
																			<Content_Block
																				// types: [img],[text],[img_and_text]
																				type={post?.type_post} 
																				role={'admin'}
																				img={post?.images}
																				text={post?.text}
																				visiable={true}
																				posts_images={posts_images}
																				id={post?._id}
																				group_id={undefined}
																				user_id={user_id}
																				refresh_posts={get_posts}
																				date={post?.date}
																				changed={post?.changed}
																				this_my_page={this_my_page}
																				set_current_img_for_view={set_current_img_for_view}
																				set_visiable_view_for_images={()=>{set_visiable_view_for_images(true)}}
																				new_images_array={new_images_array}
																				visible_images={visible_images}
																				hidden_images={hidden_images}
																				unique_token={post?.unique_token}
																			></Content_Block>
																		</div>
																	</div>
													)
														:
															<div className='blocks'>
																<div className='block-item'>
																	<div className='fill-fon'>
																		<div>
																			Записей нет
																		</div>
																	</div>
																</div>
															</div>
													}
												</div>
											</div>
										</div>
									</div>
									{(friends.length > 0 || my_groups.length) > 0 &&
										<div className='split'>
											{/* разделитель */}
										</div>
									}
									<div className={(friends.length > 0 || my_groups.length) > 0 ? 'col-3' : null}>
										<div className='blocks' style={{padding: '0px',margin: '0px'}}>
											<div className='block-item'>
												{friends.length > 0 && friends.length < 5
												?
													<div className='blocks' style={{padding: '0px', margin: '0px'}}>
														<div className='block-item'>
															<div className='user_page_friends'>
																Друзья
															</div>
															{friends.map((friend, index) =>
																<div className='people' key={index} >
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
																		</div>
																	</div>
																</div>
															)}
														</div>
													</div>
												:
													friends.length > 5 &&
													<div className='blocks' style={{margin: '0px'}}>
														<div className='block-item'>
															<div className='user_page_friends'>
																Друзья
															</div>
															{friends.map((friend, index) =>
																index < 4  &&
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
																		</div>
																	</div>
																	<div className='user_page_button' onClick={()=>{set_visiable_panel_with_more_friends(true)}}>
																		Ещё
																	</div>
																</div>
															)}
														</div>
													</div>
												}
											</div>
										</div>
										<div className='blocks'>
											<div className='block-item'>
												<div className='user_page_my_group_panel'>
													{my_groups.length > 0 && my_groups.length < 5 && my_groups
													?	
														<div className='user_page_my_group_panel_panel_collumn'>
															<div className='user_page_my_group_panel_panel_my_groups'>
																Группы
															</div>
															<div className='user_page_my_group_panel_panel_collumn_groups'>
																{my_groups.map(g=>
																	<div className='group-box' key={g._id} onClick={async () => {await join_group(g._id)}}>
																		<div className='row'>
																			<div className='group-img'>
																				<img className='group-img-profil' src={groups_profils_avatars.find(o => o.name.toString() === g.group_img.toString())?.path} alt=""/>
																			</div>
																			<div className='group-name'>
																				{g.group_name}
																			</div>
																		</div>
																		<div className='group-type'>
																			{g?.group_settings?.type_group === 'Закрытая' && '*'}
																		</div>
																	</div>								
																)}
															</div>
														</div>
													:
														my_groups.length > 5 &&
														<div className='user_page_my_group_panel_panel_collumn'>
															<div className='user_page_my_group_panel_panel_my_groups'>
																Группы
															</div>
															<div className='user_page_my_group_panel_panel_collumn_groups'>
																{my_groups.map((g, index)=>
																	index < 4 &&
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
																)}
															</div>
															<div className='user_page_button' onClick={()=>{set_visiable_panel_with_more_groups(true)}}>
																Ещё
															</div>
														</div>
													}
												</div>
											</div>
										</div>
									</div>
								</div>
							}
							{visiable_form &&
								<Form_Create_New_Record_For_User_Page
									close={set_visiable_form}
									user_page_id={user_id}
									get_posts={get_posts}
									create_new_record={''}
									ws_message_type={ws_message_type}
									ws_ref={ws_ref}
								></Form_Create_New_Record_For_User_Page>
							}
						</div>
					:
						<div className='blocks'>
							<div className='block-item'>
								данные не получены
								{user_id}
								{my_id}
							</div> 
						</div>
					}
				</div>
			</div>
		</div>
	)
};

export default User_Page;
