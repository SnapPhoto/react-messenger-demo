import React, {useState, useEffect, useRef} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import Searcher from '../../../components/searcher/search';
import axios from 'axios';
import Group_Settings_Panel from '../../../components/group_settings_panel/group_settings_panel';
import Info_Panel_Top from '../../../components/info_panel_top/info_panel_top';
import Input_Default from '../../../components/inputs/input_default/input_default';
import Password_Panel from '../../../components/password_panel/password_panel';
import View_Images from '../../../components/view_images/view_images';
import Add_title from '../../../components/form_titles/add_title.jsx';
import Content_Block from '../../../components/content/content.jsx';
import Form_Create_New_Record from '../../../components/form_create_new_record/form_create_new_record';
import Form_Selecter from '../../../components/form_selecter/form_selecter.jsx';
import Loader from '../../../components/loader/loader.jsx';
import Button_Default from '../../../components/buttons/button_default/button_default.jsx';
import Form_Set_Group_Img from '../../../components/form_set_group_img/form_set_group_img.jsx';
import Form_Set_Group_Header_Img from '../../../components/form_set_group_header_img/form_set_group_header_img.jsx';
import default_avatar from '../../../images/default/default_avatar/empty.jpg';
import Settings_Panel_Group from '../../../components/settings_panel_group/settings_panel_group.jsx';
import Panel_With_Hidden_Posts_For_Group from '../../../components/panel_with_hidden_posts_for_group/panel_with_hidden_posts_for_group.jsx';
import Panel_With_Push_User_In_Group from '../../../components/panel_with_push_user_in_group/panel_with_push_user_in_group.jsx';
import Invites_Page from '../invites_page/invites_page.jsx';
import Arhiv from '../../../components/arhiv/arhiv.jsx';
import View_For_Images from '../../../components/view_for_images/view_for_images.jsx';
import Panel_With_Add_Password from '../../../components/panel_with_add_password/panel_with_add_password.jsx';
import Panel_With_Change_Password from '../../../components/panel_with_change_password/panel_with_change_password.jsx';
import Notification_Bar from '../../../components/notification_bar/notification_bar.jsx';

function normalize_post_image_groups(images){
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
		const group = Array.isArray(parsed) ? parsed : [parsed];
		for( const item of group ){
			if( typeof item === 'string' ){
				try {
					const decoded = JSON.parse(item);
					result.push(...(Array.isArray(decoded) ? decoded : [decoded]));
				}
				catch { continue; }
			}
			else if( item && typeof item === 'object' ) result.push(item);
		}
	}
	return result.length ? [result] : [];
}

export const Current_Group = ({return_my_role, visiable_panel_with_invites, set_visiable_panel_with_invites, visiable_panel_with_push_user_in_group, set_visiable_panel_with_push_user_in_group, ws_message_type, ws_ref, my_name}) => {
	
	const [id, set_id] = useState(null);
	const [group_is_loaded, set_group_is_loaded] = useState(false);
	const { this_group_id } = useParams();
	const [my_id, set_my_id] = useState(null);
	const [this_my_group, set_this_my_group] = useState(false);

	const [group_data, set_group_data] = useState(null);
	const [groups_profils, set_groups_profils] = useState(null);
	const [groups_headers, set_groups_headers] = useState(null);

	const [panel_active, set_panel_active] = useState(false);
	const panel_ref = useRef(null);
	const navigate = useNavigate();
	const timer = useRef(null);
	const [del, set_del] = useState(false);
	const [time_count, set_time_count] = useState(10);
	const [cancel_del, set_cancel_del] = useState(false);
	const [my_role, set_my_role] = useState(null);
	const [	enter_password, set_enter_password ] = useState('');
	const [loaded_page, set_loaded_page] = useState(false);
	const [panel_enter_password, set_panel_enter_password] = useState(false);
	const [view_src, set_view_src] = useState('');

	const [add_new_title, set_add_new_title] = useState(false);
	const [title_text, set_title_text] = useState('');
	const group_titles_textarea_ref = useRef();

	//установка пароля
	const [ visiable_panel_add_password, set_visiable_panel_add_password ] = useState(false);
	//замена пароля
	const [ visiable_panel_change_password, set_visiable_panel_change_password ] = useState(false);


	const [visiable_title, set_visiable_title] = useState(false);
	const [visiable_create_new_record, set_visiable_create_new_record] = useState(false);
	const [type_new_record, set_type_new_record] = useState(null);
	const [create_new_record, set_create_new_record] = useState(false);

	const [posts, set_posts] = useState([]);
	const [default_posts, set_default_posts] = useState([])

	const [posts_images, set_posts_images] = useState([]);
	const [require_images, set_require_images] = useState(false);
	const [my_last_page, set_my_last_page] = useState(null); // данные последней страницы

	const [is_join, set_is_join] = useState(false);
	const [group_members, set_group_members] = useState([]);
	const [loading_members, set_loading_members] = useState(true);
	const [users_profils, set_users_profils] = useState([]);

	const [me_invited, set_me_invited] = useState(false); // пригласили меня в группу? 

	const [pick_file, set_pick_file] = useState(null); // аватарка группы
	const [visiable_panel_load_file, set_visiable_panel_load_file] = useState(false);
	const [loading_file_group_avatar, set_loading_file_group_avatar] = useState(false);

	const [pick_header_file, set_pick_header_file] = useState(null); // шапка группы
	const [visiable_panel_load_header_file, set_visiable_panel_load_header_file] = useState(false);
	const [loading_file_group_header, set_loading_file_group_header] = useState(false);
	
	// НАУЧИТЬСЯ СЖИМАТЬ ФАЙЛЫ ПЕРЕД ОТПРАВКОЙ (РЕКОМЕНДУЮТ НА СЕРВЕРЕ);

	const [visiable_settings_group, set_visiable_settings_group] = useState(false);
	const [visiable_panel_with_hidden_post ,set_visiable_panel_with_hidden_post] = useState(false);

	const [visiable_arhiv, set_visiable_arhiv] = useState(false);

	// для просмотра фотографий
	const [ type_arhiv, set_type_arhiv ] = useState(null);
	const [ normal_images, set_normal_images ] = useState([]);
	const [ new_images_array, set_new_images_array ] = useState([]);
	const [ current_img_for_view, set_current_img_for_view ] = useState(null);
	const [ visiable_view_for_images, set_visiable_view_for_images ] = useState(false);
	const [ visible_images, set_visible_images ] = useState([]); // видимые изображения для view_for_images.js
	const [ hidden_images, set_hidden_images ] = useState([]); // скрытые изображения для view_for_images.js

	useEffect(()=>{
		if( new_images_array ){
			console.log('new_images_array = ', new_images_array);
		}
	},[new_images_array])

	useEffect(()=>{
		if( group_data !== undefined && group_data !== null && group_data ){
			if( group_data?.group_settings?.password === '' ){
				set_panel_enter_password(false);
				set_loaded_page(true);
			};
		}
	},[group_data])

	async function clear_waiting_in_group(){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			console.log('/clear_waiting_in_group')
			const response = await axios.post('http://localhost:8080/clear_waiting_in_group', {
				group_id: this_group_id,
			}, {
				headers: {
					Authorization: `Bearer ${token}`,
				}
			});
			if( response?.data?.message ){
				console.log('Ответ от сервера: ', response?.data?.message);
				get_my_id();
			}
		}
		catch(err){
			console.error('Ошибка очистки пригласителя: ',err);
		}
	}

	async function check_waiting_in_group(){
		//get_invite_id_for_user
		if( this_my_group ){
			set_me_invited(true);
			set_loaded_page(true);
			set_panel_enter_password(false);
			return;
		};
		console.log('___ check_waiting_in_group ___')
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('http://localhost:8080/get_invite_id_for_user', {
				group_id: this_group_id,
			}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response ){
				console.log('response = ', response)
			}
			if( response?.data?.message ){
				console.log('Ответ от сервера [150]: ', response?.data?.message);
			};
			if( response?.data?.refresh ){
				//обновление
			};
			if( response?.data?.error ){
				console.error('Сервер вернул ошибку: ', response?.data?.error);
			};
			if( response?.data?.invite_user_id !== undefined && response?.data?.invite_user_id !== null ){
				// alert(response?.data?.invite_user_id);
				set_me_invited(true);
				set_loaded_page(true);
				set_panel_enter_password(false);
				await join_group();
				await clear_waiting_in_group();
			};
		}
		catch(err){
			return console.error('Ошибка получения пригласительного кода: ', err);
		}
	};
	useEffect(()=>{
		check_waiting_in_group();
	},[this_group_id, this_my_group])

	useEffect(()=>{
		console.log('_____] group_data = ', group_data);
		if( group_data?.my_waiting_join_in_group !== null ){
			const inviter = group_data?.my_waiting_join_in_group;
			Array.from(group_members).forEach(member => {
				if( member?.id === inviter ){
					set_me_invited(true);
					set_loaded_page(true);
					set_panel_enter_password(false);
				}
			})
		}
	},[group_data])

	useEffect(()=>{
		const image_data = posts_images.map(image => {
			if( image && typeof image === 'object' ) return image;
			if( typeof image !== 'string' ) return null;
			const filename = image.split('/').pop();
			return {path: image, name: filename, full_name: filename};
		}).filter(Boolean);
		set_normal_images(image_data);
	},[posts_images]);

	useEffect(()=>{
		set_create_new_record(false)
	},[is_join]);

	// это моя группа?
	useEffect(()=>{
		if( this_group_id && my_id && group_data){
			if( group_data?.group_creator === my_id ){
				set_this_my_group(true);
				console.log('Это моя группа')
			}
			else {
				set_this_my_group(false);
				console.log('Это не моя группа')
			}
		}
	},[this_group_id, my_id, group_data])

	// начальная прогрузка группы ( получение id из URL )
	async function get_my_id(){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('http://localhost:8080/get_user_data', {}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.message ){
				if( response?.data?.my_id ){
					set_my_id(response?.data?.my_id)
				}
			}
		}
		catch(err){
			console.error('Ошибка: my_id пустой');
			navigate('/page/error/not_found');
		}
	};
	useEffect(()=>{
		get_my_id()
	},[])
	useEffect(()=>{
		if( this_group_id && my_id ){
			set_group_is_loaded(true);
			set_id(this_group_id);
			set_require_images(true);
		};
	},[this_group_id, my_id])

	async function get_my_last_page(){
		//запрос на последний путь
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		console.log('this_group_id = ', this_group_id);
		try{
			const response = await axios.post('http://localhost:8080/get_my_last_page', {
				group_id: this_group_id,
			}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.last_page ){
				set_my_last_page(response?.data?.last_page);
			};
		}
		catch(err){
			console.error('Ошибка: ', err);
			navigate('/page/error/not_found');
		}
	}

	// ПРОВЕРКА ПОСЛЕДНЕГО ПУТИ
	useEffect(()=>{
		get_my_last_page();
	},[])

	async function set_last_page(){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			console.log('enter_password = ', enter_password);
			const response = await axios.post('http://localhost:8080/set_my_last_page',{
				group_id: this_group_id,
				group_password: enter_password,
			},{
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.message ){
				console.log('-----] Ответ от сервера [set_last_page] = ', response?.data?.message);
			};
			if( response?.data?.last_page ){
				console.log('-----] last_page = ', response?.data?.last_page);
			}
		}
		catch(err){
			console.error('Ошибка /set_my_last_page : ', err);
		}
	}

	// useEffect(()=>{
	// 	set_loaded_page(false);
	// 	if( !this_my_group ){
	// 		if( group_data !== null){
	// 			console.log('______] my_last_page = ', my_last_page);
	// 			if( my_last_page?.last_page !== this_group_id ){
	// 				if(group_data?.group_settings?.password !== '' && group_data?.group_settings?.password !== null && group_data?.group_settings?.password !== undefined){
	// 					set_loaded_page(false);
	// 					set_panel_enter_password(true);
	// 				}
	// 				else {
	// 					if( my_last_page?.passwords_compared ){
	// 						set_panel_enter_password(false);
	// 						set_loaded_page(true);
	// 					}
	// 					else {
	// 						set_panel_enter_password(true);
	// 						set_loaded_page(false);
	// 					}
	// 				};
	// 			}
	// 			else {
	// 				if( my_last_page?.passwords_compared ){
	// 					set_panel_enter_password(false);
	// 					set_loaded_page(true);
	// 				}
	// 				else {
	// 					set_panel_enter_password(true);
	// 					set_loaded_page(false);
	// 				}
	// 			}
	// 		}
	// 	}
	// 	else {
	// 		set_panel_enter_password(false);
	// 		set_loaded_page(true);
	// 	}
	// },[group_data, my_last_page, this_my_group]);
	//КОНЕЦ ПРОВЕРКИ ПОСЛЕДНЕГО ПУТИ

	useEffect(()=>{
		if( group_members.length > 0 ){
			group_members.forEach(member => {
				console.log('member = ', member);
				console.log('my_id = ', my_id)
				if( member?.id === my_id ){
					set_loaded_page(true);
					set_panel_enter_password(false);
				}
				else {
					if( localStorage.getItem('waiting_from_id') ){
						check_waiting_in_group();
					}
					else{
						if( this_my_group ){
							set_panel_enter_password(false);
							set_loaded_page(true);
						}
						else {
							if( group_data?.group_settings?.password === '' || group_data?.group_settings?.password.length === 0 ){
								set_panel_enter_password(false);
								set_loaded_page(true);
							}
							else{
								set_panel_enter_password(true);
								set_loaded_page(false);
							}
						}
					}
				}
			})
		}
		else{
			console.log('Пользователей в группе нет');
		}
	},[group_data, group_members, this_group_id, this_my_group]);

	useEffect(()=>{
		if( group_data !== null && my_id ){
			console.log(group_data?.group_admins)
			const finded_role = group_data?.group_admins.find(a => a.id === my_id)?.role;
			if( finded_role !== undefined && finded_role !== null ){
				set_my_role(finded_role);
				return_my_role(finded_role);
			}
		}
	},[my_id,group_data])

	useEffect(()=>{
		if( del === true && time_count > 0 ){
			timer.current = setInterval(()=>{
				if(time_count > 0 && del === true){
					set_time_count(time_count => time_count -= 1);
				};
			},1000)
		}
		else{
			if( time_count === 0 && del === true && timer.current !== null){
				console.log('Удаление группы...');
				remove_group(id)
				clearInterval(timer.current);
				timer.current = null;
			}
		}
	},[del]);

	useEffect(()=>{
		if( cancel_del ){
			set_time_count(10);
			timer.current = null;
			clearInterval(timer.current);
			set_del(false);
			set_cancel_del(false);
		};
		return ()=>{set_cancel_del(false)};
	},[cancel_del]);

	useEffect(()=>{
		if( time_count >= 0){
			console.log(time_count)
		}
		else{
			console.log('Удаление группы...');
			remove_group(id)
			clearInterval(timer.current);
			timer.current = null;
		}
	},[time_count]);

	async function get_group_data(){
		const token = localStorage.getItem('token');
		if( !token ){
			return console.error('Ошибка: Токен не определён');
		};
		try{
			const response = await axios.post('http://localhost:8080/get_group_data', {}, {
				headers: {
					Authorization: `Bearer ${token}`,
					group_id: this_group_id,
				}
			});
			if( response.data?.group_data ){
				const data = response.data?.group_data;
				let new_data = {};
				try{
					const parsed_settings = JSON.parse(data.group_settings);
					if (parsed_settings ){
						new_data = {...data, group_settings: parsed_settings}
					}
				}
				catch(err){
					const settings = data.group_settings;
					if (settings ){
						console.log(`settings = ${settings}`);
						new_data = {...data, group_settings: settings}
					}
				};
				console.log('new_data = ', new_data);
				set_group_data(new_data);
			}
			else{
				console.log('data = null');
			}
		}
		catch(err){
			console.error('Ошибка: ', err);
		}
	};

	async function get_groups_profils(){ 
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const files = (context) => context.keys().map(context);
			const imgs = files(require.context('../../../images/groups_profils/'), false, /\.(jpg)$/);
			if( imgs.length > 0 ){
				let imgs_data = [];
				imgs.map((img)=>{
					const path = img;
					const raw_name = path.split('/')[3].split('.');
					const name = raw_name[0] + '.' + raw_name[2];
					const img_data = {
						path: path,
						name: name,
					};
					imgs_data.push(img_data);
				});
				if( imgs_data.length > 0 ){
					set_groups_profils(imgs_data);
				};
			};
		}
		catch(err){
			return console.error('Ошибка: ', err);
		}
	};

	async function get_groups_headers(){ 
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const files = (context) => context.keys().map(context);
			const imgs = files(require.context('../../../images/groups_headers/'), false, /\.(jpg)$/);
			if( imgs.length > 0 ){
				let imgs_data = [];
				imgs.map((img)=>{
					const path = img;
					const raw_name = path.split('/')[3].split('.');
					const name = raw_name[0] + '.' + raw_name[2];
					const img_data = {
						path: path,
						name: name,
					};
					imgs_data.push(img_data);
				});
				if( imgs_data.length > 0 ){
					// console.log('шапки = ', imgs_data )
					set_groups_headers(imgs_data);
				};
			};
		}
		catch(err){
			return console.error('Ошибка: ', err);
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
				clear_waiting_in_group();
				// переход на главную
				await navigate('/main/groups');
			}
			else{
				console.log(response.data?.error);
			};
		}
		catch(err){
			console.error('Ошибка удаления группы')
		}
	};

	useEffect(()=>{
		if( id !== null ){
			get_group_data();
			get_groups_profils();
			get_groups_headers();
		}
	},[id]);

	useEffect(()=>{
		if( group_data !== null ){
			console.log(group_data);
		}
	},[group_data]);

	useEffect(()=>{
		function handler_leave(){
			console.log('+')
			set_panel_active(false);
		};
		if( panel_ref.current !== null){
			panel_ref.current.addEventListener('mouseleave', handler_leave);
		};
		return ()=>{
			if( panel_ref.current !== null ){
				panel_ref.current.removeEventListener('mouseleave', handler_leave);
			}
		}
	},[panel_ref.current]);

	async function check_passwords(){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		}
		if( enter_password.length > 0 ){
			try{
				const response = await axios.post('http://localhost:8080/check_passwords', {
					enter_password: enter_password,
					group_id: this_group_id,
				}, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				})
				if( response?.data?.message ){
					console.log('Ответ от сервера: ', response?.data?.message);
				};
				if( response?.data?.compare && response?.data?.refresh ){
					set_last_page();
					set_panel_enter_password(false);
					set_loaded_page(true);
				};
				console.log('____] check_passwords удачный!')
				set_last_page();
			}
			catch(err){
				return console.error('Ошибка сравнения паролей: ', err);
			}
		}
	};

	async function save_titles(){
		if( true ){
			try{
				const token = localStorage.getItem('token');
				if( !token ){
					return console.warn('Что-то с токеном не так');
				}
				const response = await axios.post('http://localhost:8080/save_titles', {
					titles: title_text.trim(' ') !== '' ? title_text : '/clear_this/',
					group_id: id,
				}, {
					headers: {
						Authorization: `Bearer ${token}`,
					}
				});
				if( response.data?.message ){
					console.log(response.data?.message);
				};
				if( response.data?.refresh ){
					get_group_data();
				}
			}
			catch(err){
				console.error('Ошибка изменения описания: ', err);
			}
		}
	};

	// async function remove_all_posts(){
	// 	try{
	// 		const response = await axios.post('http://localhost:8080/remove_all_posts', {
	// 			group_id: id,
	// 		},{});
	// 	}
	// 	catch(err){
	// 		console.error('Ошибка: ', err);
	// 	}
	// };
	// useEffect(()=>{
	// 	remove_all_posts()
	// },[])

	async function get_posts(){
		const token = localStorage.getItem('token');
		if( !token || !id ){
			return;
		};
		try{
			const response = await axios.post('http://localhost:8080/get_posts', {
				group_id: id,
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
	useEffect(()=>{
		//загрузка постов (если есть) при первом запуске
		if( id !== null ){
			get_posts();
		}
	},[id]);

	useEffect(()=>{
		console.log('посты = ', posts)
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			if( require_images ){
				const context = require.context('../../../../src/images/groups_images/', true, /\.(jpg|jpeg|png|webp)$/i);
				const current_folder = context.keys().filter(folder => folder.includes(`/${id}/`));
				const current_images = current_folder.map(key => {
					const filename = key.split('/').pop();
					const hash_match = filename.match(/^(.*)_([0-9a-f]{8,})\.(jpg|jpeg|png|webp)$/i);
					const name = hash_match ? `${hash_match[1]}.${hash_match[3]}` : filename;
					return {path: context(key), name, full_name: filename};
				});
				set_posts_images(current_images);
				set_require_images(false);
			}
		}
		catch(err){
			console.error('Ошибка загрузки изображений группы', err)
		}
	},[posts, id]);

	// получение members
	async function get_members(){
		const token = localStorage.getItem('token');
		if( !token || !id ){
			return;
		};
		try{
			const response = await axios.post('http://localhost:8080/get_members', {
				group_id: this_group_id,
			},{
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.members && response?.data?.members.length > 0 ){
				console.log('members = ', response.data?.members);
				set_group_members(response?.data?.members);
			};
			if( response.data?.join ){
				console.log('Вы среди участников группы');
				set_is_join(true);
				set_loading_members(false);
			}
			else {
				console.log('Вас нет среди участников группы. Войдите');
				set_is_join(false);
				set_loading_members(false);
				check_waiting_in_group();
			}
		}
		catch(err){
			return console.error('Ошибка: ', err);
		}
	};
	useEffect(()=>{
		get_members();
	},[group_data])

	useEffect(()=>{
		if( group_members.length > 0 ){
			try{
				const dir = (context) => context.keys().map(context);
				const profils = dir(require.context('../../../images/profils/', false, /\.(jpg)$/ ));
				if( profils.length > 0 ){
					profils.forEach(profil => {
						const raw_name = profil;
						const name_code = raw_name.split('/')[3].split('.')[0];
						if( name_code ){
							console.log('name_code = ', name_code)
						}
						if( name_code !== null || name_code !== undefined ){
							set_users_profils(users_profils => [...users_profils, {
								path: profil,
								name: name_code,
							}])
						}
					})
				}
			}
			catch(err){
				return console.error('Ошибка: ', err );
			}
		}
	},[group_members])

	useEffect(()=>{
		if( users_profils !== null && group_members ){
			console.log('users_profils = ', users_profils);
		}
	},[group_members, users_profils])

	async function join_group(){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('http://localhost:8080/join_group', {
				group_id: this_group_id,
			}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.join ){
				set_last_page();
				get_my_last_page();
				set_is_join(true);
				get_group_data();
				get_members();

				// обновление через websocket
				try{
					if( ws_ref.current !== null && ws_ref.current.readyState === 1 ){
						ws_ref.current.send(JSON.stringify({
							type: 'join_in_group',
							group_id: this_group_id,
							user: my_id,
						}))
					}
				}
				catch(err){
					throw err;
				}

			};
			if( response?.data?.refresh ){
				//обновление данных
				get_my_last_page();
				get_group_data();
				get_members()
			}
		}
		catch(err){
			return console.error('Ошибка входа: ', err);
		}
	};
	async function leave_group(){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('http://localhost:8080/leave_group', {
				group_id: this_group_id,
			}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.leave ){
				set_is_join(false)
			};
			if( response?.data?.refresh ){
				//обновление данных
				get_group_data();
				get_members();

				// обновление через websocket
				try{
					if( ws_ref.current !== null && ws_ref.current.readyState === 1 ){
						ws_ref.current.send(JSON.stringify({
							type: 'leave_from_group',
							group_id: this_group_id,
							user: my_id,
						}))
					}
				}
				catch(err){
					throw err;
				}
			};
			if( response ){
				set_group_members( group_members.filter(member=>member.id !== my_id) );
				set_is_join(false);
				get_group_data();
				get_members();
			}
		}
		catch(err){
			return console.error('Ошибка выхода: ', err);
		}
	};

	async function set_group_avatar(){
		const token = localStorage.getItem('token');
		if( !token ){
			return console.error('Ошибка токена');
		};
		if( !pick_file || pick_file === undefined || pick_file === null ){
			return console.warn('Файл не выбран');
		};
		const formdata = new FormData();
		formdata.append('file', pick_file[0]);
		formdata.append('group_id', this_group_id);
		try{
			set_loading_file_group_avatar(true);
			const response = await axios.post('http://localhost:8080/set_group_avatar', formdata ,{
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.message ){
				console.log('Аватарка установлена');
				set_loading_file_group_avatar(false);
				set_visiable_panel_load_file(false);
			};
			if( response?.data?.refresh ){
				set_loading_file_group_avatar(false);
				get_group_data();
			};
			if( response ){
				set_loading_file_group_avatar(false);
			}
		}
		catch(err){
			set_loading_file_group_avatar(false);
			return console.error('Ошибка установки аватарки группы: ', err);

		}
	};

	async function set_header_group(){
		const token = localStorage.getItem('token');
		if( !token ){
			return console.error('Ошибка токена');
		};
		if( !pick_header_file || pick_header_file === undefined || pick_header_file === null ){
			return console.warn('Файл не выбран');
		};
		const formdata = new FormData();
		formdata.append('file', pick_header_file[0]);
		formdata.append('group_id', this_group_id);
		try{
			set_loading_file_group_header(true);
			const response = await axios.post('http://localhost:8080/set_header_group', formdata ,{
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.message ){
				console.log('Шапка установлена');
				set_loading_file_group_header(false);
				set_visiable_panel_load_file(false);
			};
			if( response?.data?.refresh ){
				set_loading_file_group_header(false);
				get_group_data();
			}
		}
		catch(err){
			set_loading_file_group_header(true);
			return console.error('Ошибка установки шапки группы: ', err);
		}
	};

	useEffect(()=>{
		if( group_titles_textarea_ref.current ){
			if( visiable_title ){
				group_titles_textarea_ref.current.style.height = `${group_titles_textarea_ref.current.scrollHeight}px`;
			}
			else {
				group_titles_textarea_ref.current.style.height = 'auto';
			}
		}
	},[visiable_title, group_titles_textarea_ref])

	useEffect(()=>{
		set_visiable_panel_with_push_user_in_group(false);
	},[])

	// useEffect(()=>{
	// 	if(id){
	// 		remove_group(id)
	// 	}
	// },[id])

	useEffect(()=>{
		const next_images = [];
		const filename_of = (value) => typeof value === 'string' ? value.split(/[\\/]/).pop() : '';
		for( const post of posts.slice().reverse() ){
			for( const img of normalize_post_image_groups(post?.images).flat() ){
				const loaded = img?.data?.loaded_file || img?.loaded_file || {};
				const names = [loaded.name, loaded.file_name, loaded.full_name, loaded.path]
					.map(filename_of).filter(Boolean);
				if( names.length === 0 ) continue;
				const asset = normal_images.find(image =>
					[image.name, image.full_name, image.file_name, image.path]
						.some(asset_name => names.includes(filename_of(asset_name)))
				);
				if( asset ) next_images.push({path: asset.path, name: asset.full_name || asset.name || names[0], hide: post?.hide, index: next_images.length});
			}
		}
		set_new_images_array(next_images);
	},[posts, normal_images]);

	useEffect(()=>{
		const is_hidden = value => value === true || value === 'true';
		set_visible_images(new_images_array.filter(image => !is_hidden(image?.hide)).map((image,index)=>({...image,index})));
		set_hidden_images(new_images_array.filter(image => is_hidden(image?.hide)).map((image,index)=>({...image,index})));
	},[new_images_array]);

	function refresh_data_group(){
		set_visiable_panel_change_password(false);
		set_visiable_panel_add_password(false);
		get_group_data();
		set_last_page();
	}

	async function send_bad_request_for_group(){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('http://localhost:8080/set_bad_request_for_group', {
				group_id: this_group_id,
			},{
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.message ){
				console.log('___] Сервер вернул ответ: ', response?.data?.message);
				get_group_data();
			}
			else {
				console.log('Нет ответа от сервера');
			}
		}
		catch(err){
			return console.error('Ошибка: не удалось отправить жалобу: ', err);
		}
	}

	async function remove_bad_request_for_group(){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('http://localhost:8080/remove_bad_request_for_group', {
				group_id: this_group_id,
			},{
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.message ){
				console.log('___] Сервер вернул ответ: ', response?.data?.message);
				get_group_data();
			}
			else {
				console.log('Нет ответа от сервера');
			}
		}
		catch(err){
			return console.error('Ошибка: не удалось снять жалобу: ', err);
		}
	}

	async function add_favourites(type){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const content = {
				type: type,
				id: this_group_id,
				data: {
					img_path: groups_profils.find(g => g.name === group_data.group_img)?.path,
					name: 	group_data !== null &&
								group_data?.group_name &&
									group_data?.group_name,
				} || null,
			}
			console.log('content = ', content)
			const response = await axios.post('http://localhost:8080/add_favourites', {
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

	// очистка пользователей группы
	// async function clear_members(){
	// 	const token = localStorage.getItem('token');
	// 	if( !token ){
	// 		return;
	// 	}
	// 	try{
	// 		const response = await axios.post('http://localhost:8080/clear_members', {
	// 			group_id: this_group_id,
	// 		}, {
	// 			headers: {
	// 				Authorization: `Bearer ${token}`
	// 			}
	// 		});
	// 		if( response?.data?.message ){
	// 			console.log('Ответ от сервера: ', response?.data?.message);
	// 		};
	// 		if( response?.data?.refresh ){
	// 			//обновление каких-нибудь переменных
	// 		};
	// 		if( response?.data?.error ){
	// 			console.error('Сервер вернул ошибку: ', response?.data?.error);
	// 		}
	// 	}
	// 	catch(err){
	// 		return console.error('Ошибка очистки пользователей группы: ', err);
	// 	}
	// };
	// useEffect(()=>{
	// 	clear_members();
	// },[])
	// конец очистки пользователей группы

	useEffect(()=>{
		if( ws_message_type?.group_id && ws_message_type?.group_id === this_group_id ){
			get_members();
		};
		if( ((ws_message_type?.type === 'remove_content_for_group') || (ws_message_type?.type === 'new_post_group') || (ws_message_type?.type === 'change_content_for_group')) && ws_message_type?.group_id && ws_message_type?.group_id === this_group_id ){
			get_posts();
		}
	},[ws_message_type])

	return (
		<div className='current_group'>
			{!panel_enter_password &&
				<View_Images
					src={view_src !== '' && view_src}
					this_open={view_src !== '' && true}
					this_close={set_view_src}
					role={my_role}
					orientation={'vertical'}
				></View_Images>
			}
			<div>
				<Info_Panel_Top
					className={del ? 'info-panel-top' : 'info-panel-top-hide'}
					time_count={time_count}
					cancel={()=>{
						clearInterval(timer.current);
						timer.current = null;
						set_cancel_del(true);
					}}
				></Info_Panel_Top>
			</div>
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
							{/* <Link className='link' to=''> Уведомления </Link> */}
							<Link className='link' onClick={()=>{set_visiable_panel_with_invites(true)}}> Приглашения <Notification_Bar type={'invites'} ws_message_type={ws_message_type} my_id={my_id} my_name={my_name}></Notification_Bar></Link>
						</div>
					</div>
				</div>
				<div className='split'>
					{/* разделение */}
				</div>
				{panel_enter_password &&
					<div className='panel-enter col-8 row'>
						<Password_Panel
							value={enter_password}
							set_value={set_enter_password}
							placeholder='пароль:'
							func_click={check_passwords}
							group_data={group_data}
							info_text={'Для просмотра содержимого введите пароль'}
							type={'password'}
						>
						</Password_Panel>
					</div>
				}
				{!group_is_loaded &&
					<div className='group_is_loaded'>
						<Loader></Loader>
					</div>
				}
				<div className={`${(loaded_page && group_is_loaded) ? 'o_group' : 'c_group'} col-8`}>
					<div ref={panel_ref} className={panel_active ? 'group-settings-panel group-settings-panel-true' : 'group-settings-panel group-settings-panel-false'}>
						<Group_Settings_Panel
							remove_group={remove_group}
							group_data={group_data}
							get_group_data={get_group_data}
							del={del}
							set_del={set_del}
							role={my_role}
							cancel_del={cancel_del}
							set_visiable_panel_load_file={set_visiable_panel_load_file}
							set_visiable_panel_load_header_file={set_visiable_panel_load_header_file}
							set_visiable_panel_with_hidden_post={set_visiable_panel_with_hidden_post}
							is_join={is_join}
							set_visiable_panel_titles={set_add_new_title}
							this_my_group={this_my_group}
							this_group_id={this_group_id}
							my_id={my_id}
							posts={posts}
							posts_images={posts_images}
							set_visiable_panel_with_push_user_in_group={set_visiable_panel_with_push_user_in_group}
							visiable_panel_with_invites={visiable_panel_with_invites}
							set_visiable_panel_with_invites={set_visiable_panel_with_invites}
							set_visiable_panel_add_password={set_visiable_panel_add_password}
							set_visiable_panel_change_password={set_visiable_panel_change_password}
							send_bad_request_for_group={send_bad_request_for_group}
							remove_bad_request_for_group={remove_bad_request_for_group}
							add_favourites={add_favourites}
							ws_message_type={ws_message_type}
							ws_ref={ws_ref}
						>
						</Group_Settings_Panel>	
					</div>

					{group_data?.group_header && groups_headers &&
						<div className='current-group-big-img'>
							<img src={groups_headers.find(header=>header?.name === group_data?.group_header)?.path} alt="шапка"/>
						</div>
					}

					{/* панель с Приглашениями / Уведомлениями */}
					{visiable_panel_with_invites &&
						<Invites_Page
							close={()=>{set_visiable_panel_with_invites(false)}}
						></Invites_Page>
					}

					{visiable_panel_with_push_user_in_group &&
						<Panel_With_Push_User_In_Group
							close={()=>{set_visiable_panel_with_push_user_in_group(false)}}
							group_id={this_group_id}
							my_id={my_id}
							ws_ref={ws_ref}
						></Panel_With_Push_User_In_Group>
					}

					{visiable_panel_add_password &&
						<Panel_With_Add_Password
							close={()=>{set_visiable_panel_add_password(false)}}
							group_id={this_group_id}
							this_my_group={this_my_group}
							refresh={refresh_data_group}
						></Panel_With_Add_Password>
					}

					{visiable_panel_change_password &&
						<Panel_With_Change_Password
							close={()=>{set_visiable_panel_change_password(false)}}
							group_id={this_group_id}
							this_my_group={this_my_group}
							group_data={group_data}
							refresh={refresh_data_group}
						></Panel_With_Change_Password>
					}

					{visiable_panel_load_file &&
						<Form_Set_Group_Img
							pick_file={pick_file}
							set_file={set_pick_file}
							set_visiable={set_visiable_panel_load_file}
							set_avatar={set_group_avatar}
							loading={loading_file_group_avatar}
							old_avatar={group_data?.group_img}
							group_id={this_group_id}
							refresh_group_data={get_group_data}
						></Form_Set_Group_Img>
					}
					{visiable_panel_load_header_file &&
						<Form_Set_Group_Header_Img
							pick_file={pick_header_file}
							set_file={set_pick_header_file}
							set_visiable={set_visiable_panel_load_header_file}
							set_avatar={set_header_group}
							loading={loading_file_group_header}
							old_header={group_data?.group_header}
							group_id={this_group_id}
							refresh_group_data={get_group_data}
						></Form_Set_Group_Header_Img>
					}
					<div className='blocks'>
						<div className='row'>
							<div className='col-1' style={{minWidth: '60px', height: 'auto'}}>
								 <div className='block-item'>
								 	<div className='current-group-img'>
								 		{group_data !== null &&
								 			groups_profils !== null && groups_profils.find(g => g.name === group_data.group_img)
								 			?
								 				<img src={groups_profils.find(g => g.name === group_data.group_img)?.path} alt="картинка" onClick={(e)=>{set_view_src(e.target.src)}}/>
								 			: 
								 				<div className='current-group-img-null' onClick={()=>{if( is_join && this_my_group ){set_visiable_panel_load_file(true)}}}>
								 					{my_role === 'main_admin' || this_my_group
								 					?
								 						<div className='set_group_img'>
								 							img
								 						</div>
								 					:
								 						null
								 					}
								 				</div>
								 		}
								 	</div>
								 </div>
							</div>
							<div className='split'>
								{/* разделение */}
							</div>
							<div className='col-10'>
								<div className='row'>
									<div className='group_name'>
										{group_data !== null &&
											group_data?.group_name &&
												group_data?.group_name
										}
									</div>
								</div>
								{visiable_arhiv &&
									<Arhiv
										posts={posts}
										images={normal_images}
										return_normal_images={set_normal_images}
										close={()=>{set_visiable_arhiv(false)}}
										open_view={()=>{set_visiable_view_for_images(true)}}
										close_view={()=>{set_visiable_view_for_images(false)}}
										set_current_img_for_view={set_current_img_for_view}
										return_type_arhiv={set_type_arhiv}
										visible_images={visible_images}
									></Arhiv>
								}
								<div className='split-maxima'>
									{/* разделение */}
								</div>
								<div className='block-item'>
									<div className='row'>
										<div className='row-center row-item' onClick={()=>{set_visiable_arhiv(true)}}>
											Архив
										</div>
										{visiable_view_for_images &&
											<View_For_Images
												images={new_images_array}
												current_img={current_img_for_view}
												close={()=>{set_visiable_view_for_images(false)}}
												visible_arhiv={visiable_arhiv}
												type_arhiv={type_arhiv}
												posts={posts}
												hidden_posts={'false'}
												type_view={visiable_panel_with_hidden_post ? 'hidden' : 'visible'}
												visible_images={visible_images}
												hidden_images={hidden_images}
											></View_For_Images>
										}
										<div className='split-vertical-border'>
											{/* разделитель */}
										</div>
										{is_join &&
											<div className='row-center row-item' onClick={()=>{panel_active ? set_panel_active(false) : set_panel_active(true)}}>
												{my_role === 'main_admin' || my_role === 'admin' || this_my_group
												?
													'Настройки'
												:
													'Действия'
												}
											</div>
										}
									</div>
								</div>
								<div className='split-maxima'>
									{/* разделитель */}
								</div>
								<div className='blocks'>
									<div className='block-item'>
										<Searcher
											value={posts}
											set_value={set_posts}
											default_value={default_posts}
										>
										</Searcher>
									</div>
								</div>
								<div className='block-item'>
									<div className='current-group-page'>
										<div className='current-group-titles' onClick={()=>{set_add_new_title(true)}}>
											{group_data?.group_titles === '' &&  (my_role === 'main_admin' || this_my_group) && add_new_title === false ? is_join && 'Опишите Ваше сообщество' : null}
										</div>
										<div>
											{add_new_title && 
												<Add_title
													close={set_add_new_title}
													value={title_text}
													set_value={set_title_text}
													placeholder='...'
													save={save_titles}
													old_title={group_data?.group_titles}
												></Add_title>
											}
										</div>
										<div>
											{group_data?.group_titles.length > 0 &&
												<div className={visiable_title ? `group-titles-open` : `group-titles-close`}>
													<textarea
														ref={group_titles_textarea_ref}
														className='group-titles-textarea'
														value={group_data?.group_titles}
														onChange={()=>{}}
													>	
													</textarea>
													{!visiable_title 
													?
														<div className='titles-show-more' onClick={()=>{set_visiable_title(true)}}>
															раскрыть
														</div>
													:
														<div className='titles-show-low' onClick={()=>{set_visiable_title(false)}}>
															свернуть
														</div>
													}
												</div>
											}
										</div>	
									</div>
								</div>
								
								<div className='split-maxima'>
									{/* разделитель */}
								</div>
								{is_join && this_my_group &&
									<div className='block-item'>
										<div className='buttons-current-group'>
											<div className='button-current-group' onClick={()=>{set_create_new_record(true)}}>
												{!create_new_record 
												?
													<div className='big_text'>Создать запись</div>
												:
													<div className='big_text' onClick={(e)=>{e.stopPropagation()}}>
														в процессе создания...
													</div>
												}
											</div>
										</div>
										{create_new_record &&
											<Form_Selecter
												set_type_new_record={set_type_new_record}
												close={()=>{set_create_new_record(false)}}
												values={[
													{name: 'Текст', type: 'text', func: ()=>{set_visiable_create_new_record(true)}},
													{name: 'Изображение', type: 'img', func: ()=>{set_visiable_create_new_record(true)}},
													{name: 'Текст + Изображение', type: 'all', func: ()=>{set_visiable_create_new_record(true)}},
												]}
											></Form_Selecter>
										}
									</div>
								}
								{visiable_create_new_record && 
									<div className=''>
										<Form_Create_New_Record
											close={set_visiable_create_new_record}
											type={type_new_record}
											group_data={group_data}
											get_posts={get_posts}
											create_new_record={create_new_record}
											closed={(group_data?.group_settings?.password !== null && group_data?.group_settings?.password !== '' && group_data?.group_settings?.password.trim('') !== '') ? true : false}
											group_members={group_members}
											ws_message_type={ws_message_type}
											ws_ref={ws_ref}
										></Form_Create_New_Record>
									</div>
								}
								<div className='split-maxima'>
									{/* разделитель */}
								</div>
								<div className='row'>
									<div className='col-7'>
										{visiable_panel_with_hidden_post &&
											<Panel_With_Hidden_Posts_For_Group
												close={()=>{set_visiable_panel_with_hidden_post(false)}}
												posts={posts}
												posts_images={posts_images}
												get_posts={get_posts}
												group_id={this_group_id}
												this_my_group={this_my_group}
												set_visiable_view_for_images={()=>{set_visiable_view_for_images(true)}}
												set_current_img_for_view={set_current_img_for_view}
												new_images_array={new_images_array}
												hidden_images={hidden_images}
											>	
											</Panel_With_Hidden_Posts_For_Group>
										}
										{posts.length > 0 && posts.some(p=>p.hide === 'false')
											?
												posts.slice().reverse().map((post, index) =>
													post.hide === 'false' &&
														<div key={index} className='blocks'>
															<div className='block-item' onClick={()=>{set_visiable_arhiv(false)}}>
																<Content_Block
																	// types: [img],[text],[img_and_text]
																	type={post?.type_post} 
																	role={my_role}
																	img={post?.images}
																	text={post?.text}
																	visiable={true}
																	posts_images={posts_images}
																	id={post?._id}
																	group_id={group_data?._id}
																	refresh_posts={get_posts}
																	date={post?.date}
																	changed={post?.changed}
																	user_page_id={null}
																	hidden={post?.hide}
																	this_group={true}
																	this_my_group={this_my_group}
																	set_visiable_view_for_images={()=>{set_visiable_view_for_images(true)}}
																	set_current_img_for_view={set_current_img_for_view}
																	new_images_array={new_images_array}
																	my_id={my_id}
																	this_group_id={this_group_id}
																	ws_message_type={ws_message_type}
																	ws_ref={ws_ref}
																	unique_token={post?.unique_token || ''}
																></Content_Block>
															</div>
														</div>
										)
											:
												<div className='blocks'>
													<div className='block-item' style={{padding: '100px 0'}}>
														Постов нет
													</div>
												</div>
										}
									</div>
									<div className='split'>
										{/* разделитель */}
									</div>
									<div className='col-3'>
										<div className='blocks'>
											<div className='block-item'>
												{is_join
												?
													<Button_Default onClick={()=>{leave_group()}}>Выйти</Button_Default>
												:
													<Button_Default onClick={()=>{join_group()}}>Войти</Button_Default>
												}
											</div>
										</div>
										<div className='blocks'>
											<div className='block-item'>
												<div className='row-center'>
													{loading_members
													?
														<Loader></Loader>
													:
														group_members.length > 0 
														?
															'Пользователи'
														:
															'Пользователей нет'
														
													}
												</div>
												<div>
													{group_members.length > 0 &&
														group_members.map((member, index) => 
															<div key={member?.id || index} className='member_group'>
																{/* {console.log('member = ', member)} */}
																{/* {console.log('users_profils = ', users_profils)} */}
																<div className='member_profil_avatar'>
																	{/* аватарка */}
																	{/* {console.log('member.profil_avatar = ', member.profil_avatar )} */}
																	{(member?.profil_avatar !== false) || (member?.profil_avatar !== null) || (member?.profil_avatar !== undefined) && (member instanceof Object)
																	?
																		member?.profil_avatar !== null
																		?
																			<img src={users_profils.find(profil => profil?.name === member?.profil_avatar.split('.')[0])?.path} onClick={()=>{navigate(`/main/${member?.id}/page`)}}/>
																		:
																			<img src={default_avatar}/>
																		
																	:
																		<img src={default_avatar}/>
																	}
																</div>
																<div className='member_username'>
																	{member?.username}
																</div>
															</div>
														)
													}
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
};

export default Current_Group;