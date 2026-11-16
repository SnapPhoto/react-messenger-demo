import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../../App.css';
import App_Router from '../../../app_router/app_router';
import { BrowserRouter } from 'react-router-dom';
import Input_Default from '../../../components/inputs/input_default/input_default';
import Button_Default from '../../../components/buttons/button_default/button_default';
import axios from 'axios';
import Loader from '../../../components/loader/loader.jsx';
import { LiquidGlass } from '@liquidglass/react';
import Invites_Page from '../invites_page/invites_page.jsx';
import Form_Create_New_Record from '../../../components/form_create_new_record/form_create_new_record';
import Content_Block from '../../../components/content/content.jsx';
import View_For_Images from '../../../components/view_for_images/view_for_images.jsx';
import Voice_Recorder from '../../../components/voice/voice';
import Notification_Bar from '../../../components/notification_bar/notification_bar.jsx';

export const Account_Current_Mails = ({raw_name_of_current_mail, raw_curr_user, raw_my_data, refresh_data, set_refresh_data, set_s_user, my_id, other_id, visiable_panel_with_invites, set_visiable_panel_with_invites, ws_message_type, ws_ref, my_name}) => {

	const [curr_user, set_curr_user] = useState(raw_curr_user || false);
	const [name_of_current_mail, set_name_of_current_mail] = useState(raw_name_of_current_mail || false);
	const [my_data, set_my_data] = useState(raw_my_data || false);
	const [other_data, set_other_data] = useState([]);

	const [selected_user, set_selected_user] = useState(null); // нужно для открытия профиля, больше ни для чего

	useEffect(()=>{console.log('my_data = ', my_data)},[my_data])
	useEffect(()=>{console.log('name_of_current_mail = ', name_of_current_mail)},[name_of_current_mail])
	useEffect(()=>{console.log('curr_user = ', curr_user)},[curr_user])

	const [my_msg, set_my_msg] = useState([]);
	const [for_me_msg, set_for_me_msg] = useState([]);

	const [mails, set_mails] = useState([]);
	const [def_mails, set_def_mails] = useState([]);
	const [mail_item, set_mails_item] = useState([]);
	const [mails_normal_date, set_mails_normal_date] = useState([]);

	const [loading_page, set_loading_page] = useState(false);
	const [is_loading, set_is_loading] = useState(false);
	const [can_load_img_after_scroll, set_can_load_img_after_scroll] = useState(false);
	const [sequrity, set_sequrity] = useState(false);
 
	// передвижение mail-body объектов
	const move_mail = [];

	const [pick_item, set_pick_item] = useState(false);
	let scroll_header = 0;
	const [checked_items, set_checked_items] = useState([]);

	const [user_select, set_user_select] = useState('none');
	const [user_select_id, set_user_select_id] = useState('');
	// const [user_data, set_user_data] = useState('');

	const [mail_text, set_mail_text] = useState('');

	const [visiable_full_date, set_visiable_full_date] = useState(null); //отображение полной даты при наведении на mail-date

	const [search_text, set_search_text] = useState('');

	const [selected_files, set_selected_files] = useState('');
	const [selected_files_array, set_selected_files_array] = useState([]);
	const [pick_files, set_pick_files] = useState(false);
	const [preview_max, set_preview_max] = useState(false);
	const [preview_max_url, set_preview_max_url] = useState('');
	const [preview_url, set_preview_url] = useState('');
	const [readed_file, set_readed_file] = useState(null)

	const [open_img_in_message, set_open_img_in_message] = useState(null);
	const [roller_path, set_roller_path] = useState('');
	const [roller_index, set_roller_index] = useState(null);

	const [all_img, set_all_img] = useState([]);
	const [data_img, set_data_img] = useState([]);

	const [zoom_img, set_zoom_img] = useState(false);

	const navigate = useNavigate();

	const [ images_from_max, set_images_from_max ] = useState([]);
	const [ data_images_from_max, set_data_images_from_max ] = useState([]);

	const [profil_avatars, set_profil_avatars] = useState([]);
	const [def_profil_avatars, set_def_profil_avatars] = useState([]);
	const [my_avatar, set_my_avatar] = useState(null); // аватар моего аккаунта
	const [his_avatar, set_his_avatar] = useState(null); // аватар оппонента с кем переписка;

	const [ index_image_for_preview, set_index_image_for_preview ] = useState(0);

	// для просмотра фотографий
	const [ type_arhiv, set_type_arhiv ] = useState(null);
	const [ normal_images, set_normal_images ] = useState([]);
	const [ new_images_array, set_new_images_array ] = useState([]);
	const [ current_img_for_view, set_current_img_for_view ] = useState(null);
	const [ visiable_view_for_images, set_visiable_view_for_images ] = useState(false);
	const [ visible_images, set_visible_images ] = useState([]); // видимые изображения для view_for_images.js
	const [ hidden_images, set_hidden_images ] = useState([]); // скрытые изображения для view_for_images.js
	const [ normal_images_from_current_mails, set_normal_images_from_current_mails ] = useState([]);
	const [ data_for_view, set_data_for_view ] = useState(null);
	const [ o_images_for_current_mails_o, set_o_images_for_current_mails_o ] = useState([]); // тестовая

	// для записи голосового сообщения
	const [ recording_voice, set_recording_voice ] = useState(false); // запись идёт? да/нет
	const [ voice_recorded, set_voice_recorded ] = useState(null);
	const rec_voice_button_ref = useRef(null);	// кнопка записи ref
	const [voice_sended, set_voice_sended] = useState(false);
	const [is_sending, set_is_sending] = useState(false);
	const is_sending_ref = useRef(false);
 
	// для возврата к элементу после изменения
	const changed_element_ref = useRef(null);

	// CallBack функции
	const func_scroll_to_it_after_changed_callback_func = useCallback((content_id)=>{
		if( !content_id ){
			return console.warn('Не удаётся установить позицию на Content с id = ', content_id)
		};
		if( mails.length === 0 ){
			return console.warn('Сообщений нет. Не на чего устанавливать фокус позиции');
		};
		const mails_blocks = document.querySelectorAll('.mail-body');
		if( !mails_blocks ){
			return console.warn('Блоков с сообщениями нет');
		};
		const content_block = document.querySelector(`[content_id="${content_id}"]`);
		if( !content_block ){
			return console.warn('Нет контента для центровки');
		};
		const parent_element_one = content_block.parentElement;
		if( !parent_element_one ){
			return console.warn('[1] Хм... У этого жлемента нет родителя');
		};
		const parent_element_two = parent_element_one.parentElement;
		if( !parent_element_two ){
			return console.warn('[2] Хм... У этого жлемента нет родителя');
		};
		const parent_element_three = parent_element_two.parentElement;
		if( !parent_element_three ){
			return console.warn('[3] Хм... У этого жлемента нет родителя');
		};
		changed_element_ref.current = parent_element_three;
		if( changed_element_ref.current !== null ){
			function set_scroll_pos(){
				changed_element_ref.current.scrollIntoView({
					behavior: 'smooth',
					block: 'center'
				});
			}
			const time_out = setTimeout(set_scroll_pos, 100);
		};
	},[loading_page])

	const set_select_img_for_view_callback_func = useCallback((img, img_index, images)=>{
		if( !img || !Array.isArray(images) ) return;
		const basename = value => typeof value === 'string' ? value.split(/[\\/]/).pop().replace(/["']/g, '') : '';
		const gallery_images = images.map((entry, index) => {
			const loaded = entry?.data?.loaded_file || entry?.loaded_file || {};
			const filename = [loaded.name, loaded.file_name, loaded.path, loaded.file_path, loaded.full_name]
				.map(basename).find(name => /\.(jpg|jpeg|png|webp|gif)$/i.test(name || ''));
			if( !filename ) return null;
			return {
				name: filename,
				full_name: loaded.full_name || filename,
				path: `/images/max/${encodeURIComponent(filename)}`,
				index,
			};
		}).filter(Boolean);
		if( gallery_images.length === 0 ) return;
		set_normal_images_from_current_mails(gallery_images);
		const selected_index = Math.max(0, gallery_images.findIndex(image => image.index === img_index));
		set_data_for_view({
			current_img: {...gallery_images[selected_index], img_index: selected_index},
			current_img_index: selected_index,
			images: gallery_images,
			array_normal_images_from_current_mails: gallery_images,
		});
	},[])

	useEffect(()=>{
		if( images_from_max.length > 0 ){
			const unique_images_for_max = new Set();
			images_from_max.forEach((image) => {
				const raw_image = image.split('/');
				const normal_image = raw_image[3].split('.');
				const img = normal_image[0] + '.' + normal_image[2];
				if( !unique_images_for_max.has(img) ){
					unique_images_for_max.add(img);
					set_data_images_from_max(data_images_from_max => [...data_images_from_max, {
						name: img,
						path: image,
					}])
				}
			})
		}
	},[images_from_max]);

	function get_images_for_mail(mail){
		console.log('[get_images_for_mail]')
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		if( !mail ){
			return;
		};
		const data_img = [];
		const unique_name = new Set();
		const raw_mail = mail;
		const raw_imgs = JSON.parse(mail?.img);
		if( data_images_from_max !== null ){
			data_images_from_max.forEach((data)=>{
				raw_imgs.forEach((img)=>{
					if( img?.data?.loaded_file?.name === data?.name ){
						console.log('[129] data?.path = ', data.path);
						if( !unique_name.has(data?.path) ){
							unique_name.add(data?.path);
							data_img.push(data?.path);
						}
					}
				});
			});
		};
		if( data_img.length > 0 ){
			return data_img;
		};
	};

	useEffect(()=>{
		if( data_images_from_max !== null ){
			// console.log('[145] data_images_from_max = ', data_images_from_max);
		};
	},[data_images_from_max])

	useEffect(()=>{
		if( visiable_view_for_images ){
			// console.log('visiable_view_for_images = ', visiable_view_for_images);
		}
	},[visiable_view_for_images])

	// нужно для перехода на страницу пользователя
	useEffect(()=>{
		if( selected_user !== null ){
			set_s_user(selected_user);
		}
	},[selected_user])

	// нужно для перехода на страницу пользователя
	function set_current_user(user){
		// console.clear()
		// console.log('user = ', user)

		set_selected_user(null);
		set_selected_user(user);
	};

	function get_images_from_folder_MAX(){
		const image_urls = new Set();
		const image_entries = Array.isArray(mails) ? mails : [];
		image_entries.forEach(mail => {
			let raw_images = mail?.img;
			if( typeof raw_images === 'string' ){
				try { raw_images = JSON.parse(raw_images); } catch { raw_images = []; }
			}
			for( const entry of Array.isArray(raw_images) ? raw_images : [] ){
				const response = typeof entry === 'string' ? (()=>{try{return JSON.parse(entry)}catch{return null}})() : entry;
				const loaded = response?.data?.loaded_file || response?.loaded_file;
				const filename = loaded?.name || loaded?.file_name || loaded?.full_name;
				if( typeof filename === 'string' && filename ){
					image_urls.add(`/images/max/${encodeURIComponent(filename)}`);
				}
			}
		});
		set_images_from_max(Array.from(image_urls));
	};
	useEffect(()=>{
		get_images_from_folder_MAX();
	},[my_data, mails])

	useEffect(()=>{
		if( images_from_max ){
			// console.log('[192] images_from_max = ', images_from_max);
		}
	},[images_from_max])

	//проверка айдишников
	async function check_my_id(){
		const token = localStorage.getItem('token');
		if( !token || !my_data || !curr_user ){
			return;
		};
		try{
			// console.clear()
			console.log('curr_user = ', curr_user);
			console.log('curr_user.to = ', curr_user.to);
			console.log('curr_user.from = ', curr_user.from);
			const response = await axios.post('/check_my_id', {
				curr_user: JSON.stringify(curr_user),
			}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response.data?.message === 'Всё ок'){
				set_sequrity(true);
			}
			else {
				set_sequrity(true)
			}
		}	
		catch(err){
			console.error('Ошибка: ', err);
		}
	};
	useEffect(()=>{
		check_my_id();
	},[curr_user, my_data])

	useEffect(()=>{
		if( !curr_user && !name_of_current_mail ){
			if( localStorage.getItem('mail_data') ){
				console.log('Получаем данные из mail_data')
				const this_data = JSON.parse(localStorage.getItem('mail_data'));
				set_curr_user(this_data?.curr_user);
				set_name_of_current_mail(this_data?.name_of_current_mail);
				set_my_data(this_data?.my_data);
			}
			else{
				navigate('/sorry/page_error')
			}
		};
		if( curr_user && name_of_current_mail && my_data !== {} ){
			localStorage.setItem('mail_data', JSON.stringify({
				curr_user: curr_user,
				name_of_current_mail: name_of_current_mail,
				my_data: my_data,
			}))
			set_loading_page(true);
		};
	},[curr_user, my_data, name_of_current_mail])

	useEffect(()=>{
		console.log('refresh_data = ', refresh_data)
		if( refresh_data === true ){
			set_def_profil_avatars(profil_avatars);
			get_profil_avatars();
			console.log(def_profil_avatars)
		}
	},[refresh_data]);

	async function get_other_user_data(){
		let new_curr_user = {};
		if( !curr_user.from || !curr_user.to ){
			try{

			}
			catch(err){

			}
		}
		console.log(`curr_user.from = ${curr_user.from}`)
		console.log(`curr_user.to = ${curr_user.to}`)
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('/get_user_data', {}, {
				headers: {
					Authorization: `Bearer ${token}`,
					other_id: curr_user.from && curr_user.to ? my_data.id !== curr_user.from ? curr_user.from : curr_user.to : curr_user
				}
			});
			if( response.data?.message === 'Other' ){
				const object_other_data = {
					other_avatar: response.data?.other_avatar,
					other_date: response.data?.other_date,
					other_email: response.data?.other_email,
					other_id: response.data?.other_id,
					other_name: response.data?.other_name,
				};
				if( object_other_data ){
					set_other_data(object_other_data);
				};
			}
			//[id 1] = 68c70a5a6c7ffede5d77b550
		}
		catch(err){
			return console.error('Ошибка получения данных пользователя')
		}
	}

	useEffect(()=>{
		get_other_user_data();
	},[curr_user])

	function get_profil_avatars(){
		const files = (context) => context.keys().map(context);
		const images = files(require.context('../../../../src/images/profils', false, /\.(jpg)$/));
		if( images.length > 0 ){
			images.map((img)=>{
				set_profil_avatars(profil_avatars => [...profil_avatars, img]);
			});
		}
	};

	useState(()=>{
		get_profil_avatars();
	},[my_data]);


	// useEffect(()=>{
	// 	console.log(my_data)
	// },[my_data])

	function mail_width(){
		const mails_body = document.querySelectorAll('.form-row');
		let array_mails = [];
		let first_mail = [];
		mails_body.forEach((mail)=>{
			array_mails.push(mail);
		});
		if( array_mails.length > 0 ){
			first_mail = array_mails[0];
		};
		let width_mail = first_mail.offsetWidth + 2; 
		return pick_item ? width_mail + 35 : width_mail - 2
	};

	useEffect(()=>{
		let width_header = 0;
		let width_mail = mail_width();
		let current_mail = null;

		function handler_scroll(e){
			scroll_header = window.scrollY || 0;
			const object_header_lines = document.querySelector('.links_row');
			const object_search = document.querySelector('.search');
			const width_form = document.querySelector('.form-row');
			if( !object_header_lines ){
				return
			};
			width_mail = mail_width();

			if( scroll_header >= 210 && pick_item === true){ 
				object_header_lines.style.position = 'fixed';
				object_header_lines.style.zIndex = '1';
				object_header_lines.style.top = '0px';
				object_header_lines.style.width = `${width_mail-37}px`;
				object_header_lines.style.borderBottom = '1px solid lightgray';
				object_header_lines.style.backgroundColor = 'rgba(100,100,100,0.001)';
				object_header_lines.style.backdropFilter = 'blur(10px)';
				// object_header_lines.style.transform = `${pick_item ? 'translateX(37px)' : null}`;

				object_search.style.padding = '0 0 40px 0';
			}
			else if( scroll_header >= 210 && pick_item === false){ 
				object_header_lines.style.position = 'fixed';
				object_header_lines.style.zIndex = '1';
				object_header_lines.style.top = '0px';
				object_header_lines.style.width = `${width_mail}px`;
				object_header_lines.style.borderBottom = '1px solid lightgray';
				object_header_lines.style.backgroundColor = 'rgba(100,100,100,0.001)';
				object_header_lines.style.backdropFilter = 'blur(10px)';
				// object_header_lines.style.transform = `${pick_item ? 'translateX(37px)' : null}`;

				object_search.style.padding = '0 0 40px 0';
			}
			else if( scroll_header < 210 && pick_item === true){
				object_header_lines.style.position = '';
				object_header_lines.style.zIndex = '0';
				object_header_lines.style.top = '';
				object_header_lines.style.width = '';
				object_header_lines.style.border = 'none';
				object_header_lines.style.backgroundColor = 'whitesmoke';
				object_header_lines.style.backdropFilter = 'none';
				// object_header_lines.style.transform = `translateX(0)`;

				object_search.style.padding = '0 0 0 0';
			}
			else if( scroll_header < 210 && pick_item === false){
				object_header_lines.style.position = '';
				object_header_lines.style.zIndex = '0';
				object_header_lines.style.top = '';
				object_header_lines.style.width = '';
				object_header_lines.style.border = 'none';
				object_header_lines.style.backgroundColor = 'whitesmoke';
				object_header_lines.style.backdropFilter = 'none';
				// object_header_lines.style.transform = `translateX(0)`;

				object_search.style.padding = '0 0 0 0';
			}
		};
		function handler_resize(){
			handler_scroll();
		}
		const links_row = document.querySelector('.links_row');
		document.removeEventListener('scroll', handler_scroll);
		document.addEventListener('scroll', handler_scroll);

		window.removeEventListener('resize', handler_resize);
		window.addEventListener('resize', handler_resize);
		return ()=>{
			document.removeEventListener('scroll', handler_scroll);
			window.removeEventListener('resize', handler_resize);
		}
	},[mails, scroll_header, pick_item, user_select]);

	function add_id_into_picked_item(mail){
		if( mail && mail._id ){
			if( !checked_items.includes(mail._id) ){
				set_checked_items(checked_items => [...checked_items, mail._id]);
			}
			else{
				set_checked_items(checked_items.filter((item)=>item !== mail._id));
			}
		}
		else{
			set_checked_items(checked_items => {
				if( checked_items.includes(mail) ){
					return checked_items.filter((item)=>item !== mail);
				}
				else{
					return [...checked_items, mail];
				}
			})
		}
	};

	function remove_mail(){
		const updated_mails = mails.filter((mail)=>!checked_items.includes(mail._id));
		if( updated_mails ){
			set_mails(updated_mails);
			set_checked_items([]);
		};
	};

	useEffect(()=>{
		let select_mail_item_id = '';
		let mail_items = document.querySelectorAll('.mail-message');
		let mail_pick = document.querySelectorAll('.pick_item');
		if( !mail_items.length > 0 ){
			return;
		};
		let current_mail_id = '';
		let mouse_down = false;

		function handler_mouse_down(){
			mouse_down = true;
		};
		function handler_mouse_up(){
			mouse_down = false;
		};
		function item_enter(e){
			let number = Number(e.currentTarget.getAttribute('num'));
			if( mouse_down === true ){
				add_id_into_picked_item(number);
			}
		};
		function mail_item_mousedown(e){
			
		}
		function mail_item_mouseup(e){

		}
		function mail_item_mouseleave(e){
			mail_items.forEach((item, index)=>{
				if( index === current_mail_id - 1 ){
					item.style.color = 'black';
				}
			});
			current_mail_id = '';
			set_user_select(false);
		}
		document.removeEventListener('mousedown', handler_mouse_down);
		document.removeEventListener('mouseup', handler_mouse_up);
		document.addEventListener('mousedown', handler_mouse_down);
		document.addEventListener('mouseup', handler_mouse_up);
		mail_items.forEach((item)=>{
			item.removeEventListener('mousedown', mail_item_mousedown);
			item.removeEventListener('mouseup', mail_item_mouseup);
			item.removeEventListener('mouseleave', mail_item_mouseleave);

			item.addEventListener('mousedown', mail_item_mousedown);
			item.addEventListener('mouseup', mail_item_mouseup);
			item.addEventListener('mouseleave', mail_item_mouseleave);
		});
		mail_pick.forEach((item)=>{
			item.removeEventListener('mouseenter', item_enter);
			item.addEventListener('mouseenter', item_enter);
		})
		return ()=>{
			current_mail_id = '';
			set_user_select_id('');
			mail_items.forEach((item)=>{
				item.removeEventListener('mousedown', mail_item_mousedown);
				item.removeEventListener('mouseup', mail_item_mouseup);
				item.removeEventListener('mouseleave', mail_item_mouseleave);
			});
			mail_pick.forEach((item)=>{
				item.removeEventListener('mouseenter', item_enter);
			});
			document.removeEventListener('mousedown', handler_mouse_down);
			document.removeEventListener('mouseup', handler_mouse_up);
		}
	},[mail_item, mails, pick_item]);

	function close_this(){
		// btn_add_img_ref.current.value = '';
		// set_selected_files([]);
		// set_previews([]);
		set_mail_text('');
		// close(false);
	}

	function handle_send_click(event){
		if( is_sending_ref.current ) return;
		if( mail_text.length === 0 && selected_files.length === 0 && voice_recorded === null ){
			return console.log('Отмена');
		};
		is_sending_ref.current = true;
		set_is_sending(true);
		event.currentTarget.disabled = true;
		void add_new_post();
	}

	async function add_new_post(){
		try{
		const token = localStorage.getItem('token');

		if( voice_recorded ){
			set_mail_text('');
			set_selected_files('');
		}

		// ДЛЯ СООБЩЕНИЙ
		if( mail_text && mail_text.length > 0 && mail_text.trim() !== '' || mail_text.length === 0 && mail_text.trim() == '' && selected_files !== null ){
			if( mail_text.length === 0 && selected_files.length > 0 && !voice_recorded){
				// ПРЕДЗАГРУЗКА ФАЙЛОВ
				// загружаем файл
				try{
					console.log('Предзагрузка файлов для сообщения...')
					console.log('354')
					if( name_of_current_mail && curr_user && my_data ){
						const uploaded_files = selected_files.map((file, index) => {
							const formData = new FormData();
							formData.append('curr_user', curr_user);
							formData.append('my_data', my_data);
							formData.append('name_of_current_mail', name_of_current_mail);
							formData.append('file_index', index);
							formData.append('other_id', String(curr_user?.to === my_data?.id ? curr_user?.from : curr_user?.to || curr_user));
							formData.append('file', file);
							const response = axios.post('/pre_loader_files_for_mails', formData, {
								headers: {
									Authorization: `Bearer ${token}`
								}
							});
							if( response ){
								return response;
							}
							else{
								console.log('Загрузка файла не удалась. ');
							}
						});
						const loaded_files = await Promise.all(uploaded_files);
						console.log('Предзагруженные файлы: ',loaded_files)
						const failed_uploads = loaded_files.filter(response => !response?.data?.loaded_file);
						if( failed_uploads.length > 0 || loaded_files.length !== selected_files.length ){
							return console.error(`Не загружены все изображения: ${loaded_files.length - failed_uploads.length}/${selected_files.length}`);
						};
						// ШАГ 2 - ОТПРАВКА ПОСТА
						console.log('___ОТПРАВКА ИЗОБРАЖЕНИЯ [381]___')
						const formData_to_post = new FormData(); 
						formData_to_post.append("curr_user", JSON.stringify(curr_user));
						formData_to_post.append("files", JSON.stringify(loaded_files));
						const response_send_post = await axios.post('/main/send_message', formData_to_post, {
							headers: {
								Authorization: `Bearer ${token}`,
							}
						});
						if( response_send_post?.data?.message ){
							console.log(response_send_post?.data?.message);
							if( response_send_post?.data?.refresh === true ){
								// обновление контента
								close_this();
								await get_mails();
								await to_bottom();

								// отправка через websocket
								try{
									ws_ref.current.send(JSON.stringify({
										type: 'new_post_message',
										for: curr_user,
									}))
								}
								catch(err){
									console.error('Ошибка отправки через websocket: ', err);
								}
							}
						}
						else{
							console.log('Нет ответа от сервера');
						};
					}
					else if( !name_of_current_mail && !curr_user && !my_data ){
						console.log('Предзагрузка файлов для сообщения...');
						console.log('207')
						const uploaded_files = selected_files.map( async (file, index) => {
							const formData = new FormData();
							formData.append('type', 'file');
							formData.append('file_index', index);
							formData.append('other_id', String(curr_user?.to === my_data?.id ? curr_user?.from : curr_user?.to || curr_user));
							formData.append('file', file);
							const response = await axios.post('/pre_loader_files_for_mails', formData, {
								headers: {
									Authorization: `Bearer ${token}`
								}
							});
							if( response ){
								// КАК-ТО СДЕЛАТЬ ПРОВЕРКУ СТАТУСА ПРОМИСА. Promise?.status НЕ РАБОТАЕТ!
								return response;
							}
							else{
								console.log('Загрузка файла не удалась. ');
							}
						});
						const loaded_files = await Promise.all(uploaded_files);
						console.log('Предзагруженные файлы: ',loaded_files)
						if( !loaded_files ){
							return console.error('Не удалось подготовить файлы');
						};
						// ШАГ 2 - ОТПРАВКА ПОСТА
						const formData_to_post = new FormData();
						formData_to_post.append("type", 'file');
						formData_to_post.append("files", JSON.stringify(loaded_files) || null);
						formData_to_post.append("curr_user", JSON.stringify(curr_user) || null);
						const response_send_post = await axios.post('/main/send_message', formData_to_post, {
							headers: {
								Authorization: `Bearer ${token}`,
							}
						});
						if( response_send_post?.data?.message ){
							console.log(response_send_post?.data?.message);
							if( response_send_post?.data?.refresh === true ){
								// обновление контента
								close_this();
								await get_mails();
								await to_bottom();

								// отправка через websocket
								try{
									ws_ref.current.send(JSON.stringify({
										type: 'new_post_message',
										for: curr_user,
									}))
								}
								catch(err){
									console.error('Ошибка отправки через websocket: ', err);
								}
							}
						}
						else{
							console.log('Нет ответа от сервера');
						};
					};
				}
				catch(err){
					return console.error('Ошибка загрузки изображения!', err);
				}
			};
			if( mail_text.length > 0 && selected_files.length === 0 && !voice_recorded){
				// загружаем текст
				console.log('Отправка текста...')
				console.log('457');
				try{
					// ОТПРАВКА ПОСТА
					console.log('___ОТПРАВКА ТЕКСТА [460]___')
					console.log('curr_user = ', curr_user);
					console.log('text = ', mail_text);
					const formData_to_post = new FormData();
					formData_to_post.append("type", 'text');
					formData_to_post.append("curr_user", JSON.stringify(curr_user));
					formData_to_post.append("text", mail_text || '');
					const response_send_post = await axios.post('/main/send_message', formData_to_post, {
						headers: {
							Authorization: `Bearer ${token}`,
						}
					});
					if( response_send_post?.data?.message ){
						console.log(response_send_post?.data?.message);
						if( response_send_post?.data?.refresh === true ){
							// обновление контента
							close_this();
							await get_mails();
							await to_bottom();

							// отправка через websocket
							try{
								ws_ref.current.send(JSON.stringify({
									type: 'new_post_message',
									for: curr_user,
								}))
							}
							catch(err){
								console.error('Ошибка отправки через websocket: ', err);
							}
						}
					}
					else{
						console.log('Нет ответа от сервера');
						console.log('Сервер вернул: ', response_send_post?.data)
					};
				}
				catch(err){
					console.error('Ошибка: ', err);
				}
			};
			if( mail_text.length > 0 && selected_files.length > 0 && !voice_recorded){
				// загружаем файлы и текст
				console.log('Загружаем файлы и текст...');
				console.log('492');
				try{
					console.log('Предзагрузка файлов для сообщения...');
					console.log('495')
					const uploaded_files = selected_files.map(async (file, index) => {
						const formData = new FormData();
						formData.append('file_index', index);
						formData.append('other_id', String(other_id || (curr_user?.to === my_data?.id ? curr_user?.from : curr_user?.to || curr_user)));
						formData.append('file', file);
						const response = await axios.post('/pre_loader_files_for_mails', formData, {
							headers: {
								Authorization: `Bearer ${token}`
							}
						});
						if( response ){
							// КАК-ТО СДЕЛАТЬ ПРОВЕРКУ СТАТУСА ПРОМИСА. Promise?.status НЕ РАБОТАЕТ!
							return response;
						}
						else{
							console.log('Загрузка файла не удалась. ');
						}
					});
					const loaded_files = await Promise.all(uploaded_files);
					console.log('Предзагруженные файлы: ',loaded_files)
					const failed_uploads = loaded_files.filter(response => !response?.data?.loaded_file);
					if( failed_uploads.length > 0 || loaded_files.length !== selected_files.length ){
						return console.error(`Не загружены все изображения: ${loaded_files.length - failed_uploads.length}/${selected_files.length}`);
					};
					// ШАГ 2 - ОТПРАВКА ПОСТА
					const formData_to_post = new FormData();
					formData_to_post.append("type", 'file_and_text');
					formData_to_post.append("files", JSON.stringify(loaded_files) || null);
					formData_to_post.append("text", mail_text || '')
					formData_to_post.append("curr_user", JSON.stringify(curr_user) || null);
					const response_send_post = await axios.post('/main/send_message', formData_to_post, {
						headers: {
							Authorization: `Bearer ${token}`,
						}
					});
					if( response_send_post?.data?.message ){
						console.log(response_send_post?.data?.message);
						if( response_send_post?.data?.refresh === true ){
							// обновление контента
							close_this();
							await get_mails();
							await to_bottom();

							// отправка через websocket
							try{
								ws_ref.current.send(JSON.stringify({
									type: 'new_post_message',
									for: curr_user,
								}))
							}
							catch(err){
								console.error('Ошибка отправки через websocket: ', err);
							}
						}
					}
					else{
						console.log('Нет ответа от сервера');
					};
				}
				catch(err){
					return console.error('Ошибка загрузки изображения!', err);
				}
			};
			if( voice_recorded ){
				// сперва очищаем текст, если что-то написано
				set_mail_text('');
				console.log('ТЕКСТ ОЧИЩЕН!')
				// загружаем голосовое сообщение
				console.log('Загружаем голосовое сообщение...');
				const token = localStorage.getItem('token');
				if( !token ){
					return console.error('Ошибка токена!');
				};
				try{
				  const formData = new FormData();
				  formData.append('type', 'voice');
				  formData.append('curr_user', JSON.stringify(curr_user));
				  formData.append('voice', voice_recorded, 'voice-webm');
				  const response = await axios.post('/main/send_message', formData, {
				  	headers: {
				  		Authorization: `Bearer ${token}`
				  	}
				  });
				  if( response?.data?.message ){
				    console.log('Сервер вернул ответ: ', response?.data?.message);
				    set_voice_sended(true);
				    close_this();
				    await get_mails();
				    await to_bottom();

				    // отправка через websocket
				    try{
				    	ws_ref.current.send(JSON.stringify({
				    		type: 'new_post_message',
				    		for: curr_user,
				    	}))
				    }
				    catch(err){
				    	console.error('Ошибка отправки через websocket: ', err);
				    }
				  }
				  else{
				    console.log('Голосовой записи не отправлено/не принято')
				  };
				}
				catch(err){
				  console.error('Ошибка отправки аудио на сервер: ', err);
				}
			}
		}
		} finally {
			is_sending_ref.current = false;
			set_is_sending(false);
		}
	};

	async function sender_mail(){
		if( mail_text.length > 0 && mail_text.trim() !== '' || mail_text.length === 0 && mail_text.trim() == '' && selected_files !== null){
			const token = localStorage.getItem('token');
			const raw_date = Date.now();
			const obj_date = new Date(raw_date);
			const year = obj_date.getFullYear();
			const month = String(obj_date.getMonth() + 1).padStart(2, '0');
			const day = String(obj_date.getDate()).padStart(2,'0');
			const hours = String(obj_date.getHours()).padStart(2,'0');
			const minutes = String(obj_date.getMinutes()).padStart(2,'0');
			const seconds = String(obj_date.getSeconds()).padStart(2,'0');

			const last_index = Number(mails.length + 1);
			let last_id = 0;
			mails.forEach((mail)=>{
				if( mail ){
					last_id = mail._id
				}
			});

			function pre_loader_files_for_mails(){
				if( selected_files === null || selected_files.length === 0 ){
					return;
				};
				const uploaded_files = selected_files.map((file, index) => {
					const formData = new FormData();
					formData.append('file_index', index);
					formData.append('other_id', String(other_id || (curr_user?.to === my_data?.id ? curr_user?.from : curr_user?.to || curr_user)));
					formData.append('file', file);
					const response = axios.post('/pre_loader_files_for_mails', formData, {
						headers: {
							Authorization: `Bearer ${token}`
						}
					});
					if( response ){
						return response;
					}
					else{
						console.log('Загрузка файла не удалась. ');
					}
				});
				return uploaded_files;
			};
			const preloaded_files = await pre_loader_files_for_mails();
			console.log('loaded_files = ', preloaded_files);
			const formData = new FormData();
			formData.append("curr_user", JSON.stringify(curr_user));
			formData.append("message", mail_text || '');
			formData.append("file", selected_files);
			formData.append("voice", voice_recorded, 'voice-recoiding-webm');

			console.log('formData:', formData);
			console.log('selected_files:', selected_files);
			console.log('mail_text:', mail_text);

			try{
				if( curr_user ){
					console.log('curr_user = ', curr_user)
				}
				// Отправка запроса
		        const response = await axios.post('/main/send_message', formData,{
		            headers: {
		                Authorization: `Bearer ${token}`,
		            }
		        });
				if( response ){
					set_selected_files(null);
					set_mail_text('');
					const text_area = document.querySelector('.auto-grow');
					if( text_area ){
						function resize(textarea){
							textarea.style.height = '40px';
							// textarea.style.height = textarea.scrollHeight + 'px';
						};
						resize(text_area);
					}
					localStorage.removeItem('mail_data');
					localStorage.setItem('mail_data', JSON.stringify({
						curr_user: curr_user,
						name_of_current_mail: name_of_current_mail,
						my_data: my_data,
					}));
					await get_mails();
					await to_bottom();
				}
			}
			catch(err){
				console.log('ОШИБКА : ', err)
			};
		}
	};

	useEffect(()=>{
		function resize(textarea){
			textarea.style.height = '42px';
			textarea.style.height = textarea.scrollHeight + 'px';
		};
		const textarea = document.querySelector('.auto-grow');
		const h_resize = () => resize(textarea);
		if( textarea ){
			textarea.addEventListener('input', h_resize);

			return ()=>{
				textarea.removeEventListener('input',h_resize);
			}
		};
	},[mail_text])

	async function get_mails(){
		console.log('can_load_img_after_scroll = ', can_load_img_after_scroll);
		set_is_loading(false);
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		if( !curr_user ){
			return;
		}
		try{
			const response = await axios.post('/main/get_messages', {
				user_select_id: curr_user,
			}, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if( response ){
				if( response.data?.from_my_messages && response.data?.from_my_messages !== null ){
					set_my_msg(response.data?.from_my_messages);
				};
				if( response.data?.for_me_messages && response.data?.for_me_messages !== null ){
					set_for_me_msg(response.data?.for_me_messages);
				};
				if( response.data?.all_msg && response.data?.add_msg !== null ){
					localStorage.removeItem('mail_data');
					set_mails( response.data?.all_msg );
					set_def_mails(response.data?.all_msg);
					if( curr_user && name_of_current_mail ){
						localStorage.setItem('mail_data', JSON.stringify({
							curr_user: curr_user,
							name_of_current_mail: name_of_current_mail,
							my_data: my_data,
						}))
					}
					console.log('Сообщения есть!')
				};
				set_is_loading(true);
			}
			else{
				set_is_loading(true);
			}
		}
		catch(err){
			console.error('Ошибка получения сообщений: ', err);
		}
	};

	useEffect(()=>{
		if( curr_user && name_of_current_mail && my_data ){
			get_mails();
		}
	},[curr_user, name_of_current_mail, my_data]);

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

	useEffect(()=>{
		// поиск
		if( def_mails.length > 0 ){
			const searchered_mails = def_mails.filter((mail)=>mail.message.toLowerCase().includes(search_text.toLowerCase()));
			set_mails([...searchered_mails])
		}
	},[search_text]);

// 	useEffect(()=>{
// 		if( mails.length > 0 ){
// 			const files = (context) => context.keys().map(context);
// 			const images = files(require.context('../../../images/max', false, /\.(jpg)$/));
// 			if( images ){
// 				set_all_img(images);
// 			};
// 		}
// 	},[mails]);
// 
// 	useEffect(()=>{
// 		if( all_img.length > 0 ){
// 			all_img.forEach((img)=>{
// 				mails.forEach((mail)=>{
// 					if( mail.img !== null ){
// 						if(img.includes(mail.img.split('.')[0])){
// 							console.log('img = ', img);
// 							console.log('mail.img = ', mail.img)
// 							set_data_img((data_img)=>[...data_img, {path: img, name: mail.img}])
// 						}
// 					}
// 				});
// 			});
// 		}
// 	},[all_img]);

	useEffect(() => {
	  if (mails.length > 0) {
	    const files = (context) => context.keys().map(context);
	    const images = files(require.context('../../../images/max', false, /\.(jpg)$/));
	    if (images) {
	      set_all_img(images);
	    }
	  }
	}, [mails]);

	useEffect(() => {
	  if (all_img.length > 0 && mails.length > 0) {
	    // Создаем Map для быстрого поиска
	    const imageMap = new Map(all_img.map(img => [img.split('/').pop().split('.')[0], img]));
	    
	    // Собираем данные изображений
	    const data = mails
	      .filter(mail => mail.img !== null)
	      .map(mail => {
	        const baseName = mail.img.split('.')[0];
	        const path = imageMap.get(baseName);
	        if (path) {
	          return { path, name: mail.img };
	        }
	      })
	      .filter(item => item); // Удаляем undefined

	    set_data_img(data);
	  }
	}, [all_img, mails]);

	function select_input_file () {
		const input_file = document.querySelector('.input-file');
		if( !input_file ){
			return;
		};
		set_pick_files(true);
	};

	useEffect(()=>{
		if( pick_files === false ){
			set_mail_text('');
		}
	},[pick_files])

	function set_files (files) {
		if( !files ){
			return;
		};
		const files_for_preload = [];
		if( files.length > 1 ){
			const files_for_preview = [];
			console.log('Вы выбрали файлы: ', files);
			Array.from(files).forEach((file, index)=>{
				console.log('FILE = ', file)
				if( file.size > 10 * 1024 * 1024 ){
					console.warn(`Файл [${file}] превышает размер 10 мб`);
					return;
				};
				const url = URL.createObjectURL(files[index]);
				if( !url ){
					return
				};
				files_for_preview.push(url);
				files_for_preload.push({file: file, file_index: index});
				console.log('Вы выбрали: ', files[index]);
				const reader = new FileReader();
				reader.onload = async (event) => {
					const data = event.target.result;
					console.log('data = ', data);
				};
				reader.onprogress = (event) => {
					const progress_bar = document.querySelector('.progress-bar');
					if( !progress_bar ){
						return;
					};
					progress_bar.setAttribute('max', event.total);
					progress_bar.setAttribute('value', event.loaded);
				};
				reader.onerror = (error) => {
					console.error('Ошибка чтения файла ', error);
				};
				reader.onloadstart = (event) => {
					const progress = document.querySelector('.preview-progress-loader');
					if( !progress ){
						return;
					};
					progress.style.display = 'flex';
				};
				reader.onloadend = (event) => {
					const progress = document.querySelector('.preview-progress-loader');
					if( !progress ){
						return;
					};
					progress.style.display = 'none';
				};
				reader.readAsDataURL(files[index]);
			})
			if( files_for_preview.length > 0 ){
				set_preview_url(files_for_preview);
				set_selected_files(Array.from(files));
				set_selected_files_array(Array.from(files));
			};
		}
		else {
			if( files[0].size > 10 * 1024 * 1024 ){
				console.warn('Файл превышает размер 10 мб');
				return;
			};
			const url = URL.createObjectURL(files[0]);
			if( !url ){
				return
			};
			set_preview_url(url);
			set_selected_files([files[0]]);
			set_selected_files_array([files[0]]);
			files_for_preload.push({file: files[0], file_index: 0});
			if( files_for_preload.length > 0 ){
				console.log('files_for_preload = ', files_for_preload);
			};
			console.log('Вы выбрали: ', files[0]);
			const reader = new FileReader();
			reader.onload = async (event) => {
				const data = event.target.result;
				console.log('data = ', data);
			};
			reader.onprogress = (event) => {
				const progress_bar = document.querySelector('.progress-bar');
				if( !progress_bar ){
					return;
				};
				progress_bar.setAttribute('max', event.total);
				progress_bar.setAttribute('value', event.loaded);
			};
			reader.onerror = (error) => {
				console.error('Ошибка чтения файла ', error);
			};
			reader.onloadstart = (event) => {
				const progress = document.querySelector('.preview-progress-loader');
				if( !progress ){
					return;
				};
				progress.style.display = 'flex';
			};
			reader.onloadend = (event) => {
				const progress = document.querySelector('.preview-progress-loader');
				if( !progress ){
					return;
				};
				progress.style.display = 'none';
			};
			reader.readAsDataURL(files[0]);
		}
	};

	function close_preview_max(){
		set_preview_max(null);
		set_preview_max_url(null);
	};

	function remove_preview(preview_url){
		if( !preview_url ){
			return;
		};
		Array.from(preview_url).forEach((preview)=>{
			URL.revokeObjectURL(preview)
		});
		set_selected_files(null); 
		set_preview_max(false)
	}

	function open_img(img){
		if( img ){
			set_open_img_in_message(img.path)
			set_roller_path(img.path.split('/').pop());

			// установка базового индекса
			const images = document.querySelectorAll('.img_into_message');
			if( images.length > 0 ){
				let name = img.name;
				images.forEach((i, index)=>{
					let raw_new_name = i.src.split('/').pop().split('.');
					let new_name = raw_new_name[0] + '.' + raw_new_name[2];
					if( new_name === name ){
						set_roller_index(index);
					}
				});
			}
		}
	}
	useEffect(()=>{
		if( roller_index !== null ){
			const roller_images = document.querySelectorAll('.roll-img');
			if( roller_images.length > 0 ){
				roller_images.forEach((i,index)=>{
					if( index === roller_index ){
						// i.style.scale = '1.1';
						// i.style.transition = 'all 1s';
						i.style.border = '5px solid black';
						roller_images[index].scrollIntoView({
							behavior: 'smooth',
							block: 'center',
						})
					}else{
						i.style.scale = '1';
						i.style.border = 'none';
						i.style.border = '5px solid whitesmoke';

					}
				})
			}
		}
	},[roller_index, mails]);
	function close_img(){
		set_open_img_in_message(null);
		set_roller_index(null)
	}

	// function zoom(){
	// 	const opened_img = document.querySelector('.opened-img');
	// 	if( zoom_img === false ){
	// 		set_zoom_img(true);
	// 		opened_img.style.scale = '2';
	// 	}
	// 	else{
	// 		set_zoom_img(false);
	// 		opened_img.style.scale = '1';
	// 	}
	// };

	useEffect(()=>{
		let current_index = 0;
		let new_path = '';
		const roller_images = document.querySelectorAll('.roll-img');
		roller_images.forEach((i,index)=>{
			if( i.src.split('/').pop() === roller_path ){
				current_index = index;
			}
		})
		function key_down(e){
			if(e.key === 'ArrowLeft'){
				if( current_index > 0 ){
					current_index = current_index-1
					roller_images.forEach((i,index)=>{
						if( index === current_index ){
							new_path = i;
							set_roller_path(new_path.src.split('/').pop());
							set_open_img_in_message(new_path.src);
							set_roller_index(index)
						}
					})
				} 
			};
			if(e.key === 'ArrowRight'){
				if( current_index < roller_images.length-1 ){
					current_index = current_index+1
					roller_images.forEach((i,index)=>{
						if( index === current_index ){
							new_path = i;
							set_roller_path(new_path.src.split('/').pop());
							set_open_img_in_message(new_path.src);
							set_roller_index(index)
						}
					})
				} 
			};
		}

		document.addEventListener('keydown',key_down);
		return ()=>{
			document.removeEventListener('keydown',key_down);
		}
	},[mails, open_img_in_message, roller_path])


	// useEffect(()=>{
	// 	def_mails.forEach((mail)=>{
	// 		if( mail.status === 'uncheck' && mail.to === my_data.id){
	// 			async function check_seen_mails(){
	// 				const token = localStorage.getItem('token');
	// 				if( token ){
	// 					try{
	// 						console.log('отправка на изменение: mail = ', mail)
	// 						const response = await axios.post('/mails/change_status', {
	// 							mail: mail,
	// 						}, {
	// 							headers: {
	// 								Authorization: `Bearer ${token}`
	// 							}
	// 						});
	// 						if( response.data.message !== '' ){
	// 							await get_mails();
	// 						}
	// 					}
	// 					catch(err){
	// 						console.error('Ошибка отметки "прочитано" ', err);
	// 					}
	// 				}
	// 			}	
	// 			check_seen_mails();
	// 		}
	// 	})
	// },[mails])



	async function remove_messages(){
		const token = localStorage.getItem('token');
		if( checked_items.length > 0 && token ){
			async function remove(){
				try{
					const response = await axios.post('/remove_message', {
						checked_items: JSON.stringify(checked_items),
					}, {
						headers: {
							Authorization: `Bearer ${token}`,
						}
					});
					if( response ){
						await get_mails();

						// отправка через websocket
						try{
							ws_ref.current.send(JSON.stringify({
								type: 'remove_message',
								for: curr_user,
							}))
						}
						catch(err){
							console.error('Ошибка отпарвки через websocket: ', err);
						}
					}
				}
				catch(err){
					console.error('Ошибка удаления сообщений: ', err);
				}
			}
			remove();
		}
	};

	function to_top(){
		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		})
	};
	function to_bottom(){
		set_can_load_img_after_scroll(false)
		let timer = null;
		const mails_block = document.querySelectorAll('.mail-body');
		if( mails_block.length > 0 ){
			mails_block.forEach((m)=>{
				m.scrollIntoView({
					behavior: 'auto',
					block: 'center',
				});
				// задержка (НАСТРОИТЬ!!!!!)
				timer = setTimeout(()=>{set_can_load_img_after_scroll(true)},100);
			})
		}
		return ()=>{
			if( timer !== null ) clearTimeout(timer);
		}
	};
	useEffect(()=>{
		if( mails.length > 0 ){
			// to_bottom();
		}
	},[mails])

	useEffect(()=>{
		async function new_get_other_data(){
			const token = localStorage.getItem('token');
			if( !token ){ return };
			try{
				const response = await axios.post('/get_user_data', {}, {
					headers: {
						Authorization: `Bearer ${token}`,
						other_id: curr_user,
					}
				});
				if( response ){
					console.log('Нашёл! ', response)
				}
			}
			catch(err){
				console.error('Ошибка: ', err);
			}
		}
		if( curr_user && other_data.length > 0){
			new_get_other_data();
		}
	},[curr_user]);

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
	};

	// useEffect(()=>{
	// 	async function remove_all_messages_for_current_mails(){
	// 		const response = await axios.post('/remove_all_messages_for_current_mails', {}, {})
	// 	}
	// 	remove_all_messages_for_current_mails()
	// },[])

	async function add_favourites_for_mails(type, img_path, images, current_id, text, voice){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		// console.log('img_path = ', img_path[0]?.path);
		// console.log('_-_-_-_-_ images = ', images);
		try{
			const content = {
				type: type,
				my_id: my_id,
				id: current_id,
				data: {
					img_path: img_path || null,
					images: JSON.stringify(images) || null,
					text: text || null,
					voice: voice || null,
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

	async function add_favourites_for_images(type, img_path){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		console.log('img_path = ', img_path);
		try{
			const content = {
				type: type,
				my_id: my_id,
				id: img_path,
				data: {
					img_path: img_path || null,
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

	function remove_preview_file(file, index){
		if( !file || index === undefined ){
			return;
		};
		console.log('[ УДАЛЯЕМЫЙ ИНДЕКС ] ', index)
		if( selected_files.length > 1 ){
			console.log('selected_files = ', selected_files)
			const file_list = [];
			Array.from(selected_files).forEach((file)=>{
				file_list.push(file);
			});
			if( file_list.length > 0 ){
				console.log('[ ДО ] file_list = ', file_list)
				const filtered_file_file = file_list.filter((f, i) => i !== index );
				console.log('[ ПОСЛЕ ] file_list = ', filtered_file_file)
				set_selected_files(filtered_file_file);
				set_preview_url((preview_url) => preview_url.filter((preview, preview_index) => preview_index !== index))
			}
		}
		else {
			set_selected_files('');
			set_preview_url('');
		}
	};

	

	function func_scroll_to_it_after_changed(content_id){
		if( !content_id ){
			return console.warn('Не удаётся установить позицию на Content с id = ', content_id)
		};
		if( mails.length === 0 ){
			return console.warn('Сообщений нет. Не на чего устанавливать фокус позиции');
		};
		const mails_blocks = document.querySelectorAll('.mail-body');
		if( !mails_blocks ){
			return console.warn('Блоков с сообщениями нет');
		};
		const content_block = document.querySelector(`[content_id="${content_id}"]`);
		if( !content_block ){
			return console.warn('Нет контента для центровки');
		};
		const parent_element_one = content_block.parentElement;
		if( !parent_element_one ){
			return console.warn('[1] Хм... У этого жлемента нет родителя');
		};
		const parent_element_two = parent_element_one.parentElement;
		if( !parent_element_two ){
			return console.warn('[2] Хм... У этого жлемента нет родителя');
		};
		const parent_element_three = parent_element_two.parentElement;
		if( !parent_element_three ){
			return console.warn('[3] Хм... У этого жлемента нет родителя');
		};
		changed_element_ref.current = parent_element_three;
		if( changed_element_ref.current !== null ){
			function set_scroll_pos(){
				changed_element_ref.current.scrollIntoView({
					behavior: 'smooth',
					block: 'center'
				});
			}
			const time_out = setTimeout(set_scroll_pos, 100);
		};
	};

	useEffect(()=>{
		if( voice_recorded !== null ){
			console.log('voice_recorded = ', voice_recorded)
		}
		else{
			console.log('voice_recorded очищен')
		}
	},[voice_recorded])

	useEffect(()=>{
		if( ws_message_type !== null ){
			if( ws_message_type?.for?.to === my_id || ws_message_type?.for?.from === my_id ){
				get_mails();
			};
			if( (ws_message_type?.type === 'change_content_for_mail') || (ws_message_type?.type === 'change_status_for_mail')){
				const exist_content = mails.find(mail => mail?._id === ws_message_type?.content_id);
				if( exist_content ){
					get_mails();
				}
			};
			if( ws_message_type?.type === 'remove_mail' && ws_message_type?.for?.to === my_id || ws_message_type?.for?.from === my_id ){
				get_mails();
			}
		};
	},[ws_message_type])

	return (
		<div className='account_current_mails'>
			{preview_max &&
				!preview_max_url &&
					preview_url
					?	
						preview_url instanceof Array
						?
							<div className='preview-max-container-objectUrl'>
								<div className='preview-max-panel-objectUrl'>
									<div className='preview-max-objectUrl'>
										{preview_url.map((preview, index) =>
											index === index_image_for_preview &&
											<div className='preview-max-box-objectUrl' key={index}>
												<img className='preview-max-img-objectUrl' src={preview} alt="Preview_Max"/>
											</div>
										)}
										<div className='preview-max-scroll-bar-objectUrl'>
											{preview_url.map((preview, index) =>
												<img className='preview-max-scroll-bar-img-objectUrl' key={index} src={preview} alt="Preview_Max" onClick={()=>{set_index_image_for_preview(index)}}/>
											)}
										</div>
									</div>
									<div className='preview-max-close-objectUrl' onClick={()=>{set_preview_max(null); set_preview_max_url(null)}}>
										Закрыть
									</div>
								</div>
								<div className='preview-max-fon-objectUrl' onClick={()=>{set_preview_max(null); set_preview_max_url(null)}}>
									{/* фон */}
								</div>
							</div>
						:
							<div className='preview-max-container-objectUrl'>
								<div className='preview-max-panel-objectUrl'>
									<div className='preview-max-box-single-objectUrl'>
										<img className='preview-max-img-single-objectUrl' src={preview_url} alt="Preview_Max"/>
									</div>
									<div className='preview-max-close-objectUrl' onClick={()=>{set_preview_max(null); set_preview_max_url(null)}}>
										Закрыть
									</div>
								</div>
								<div className='preview-max-fon-objectUrl' onClick={()=>{set_preview_max(null); set_preview_max_url(null)}}>
									{/* фон */}
								</div>
							</div>
					:
						null

			}
			{open_img_in_message &&
				<div className='preview-max' >
					<div>
						{mails.length > 0
						?	
							<div className='roller-img' style={{color: 'white', zIndex: '2'}}>
								{mails.map(mail=>
									data_img
									.filter(item => item.name === mail.img)
									.map(item =>
										<div key={mail._id} className='roll-box'>
											<img className='roll-img' src={item.path} alt="Фотография" onClick={()=>{open_img(item)}}/>
										</div>
									)
								)}
							</div>
						:
							null
						}
					</div>
					<div className='preview-box-fon' onClick={()=>{close_preview_max(); close_img()}}>
						{/* фон */}
					</div>
					<div className='preview-box'>
						<div className='preview-box-img'>
							<img className='opened-img' src={open_img_in_message} alt="Фотография" onClick={(e)=>{e.stopPropagation()}}/>
						</div>
						<div className='button_add_in_favourite' onClick={()=>{add_favourites_for_images('image', open_img_in_message)}}>
							{/* добавить в избранное */}
						</div>
					</div>
				</div>
			}

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
						<div className='block-item' style={{textAlign: 'left', padding: '2px', boxSizing: 'border-box', backgroundColor: 'white'}}>
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
				<div className='col-8 mail-col'>
					{/* просмотр изображений */}
					{visiable_view_for_images &&
						<View_For_Images
							images={normal_images_from_current_mails}
							current_img={data_for_view?.current_img || null}
							close={()=>{set_data_for_view(null); set_visiable_view_for_images(false)}}
							visible_arhiv={null}
							type_arhiv={null}
							posts={null}
							hidden_posts={'false'}
							type_view={'current_mails'}
							visible_images={normal_images_from_current_mails}
							hidden_images={null}
							for_current_mails={true}
							images_for_current_mails={null}
							images_from_max={images_from_max}
							normal_images_from_current_mails={normal_images_from_current_mails}
							data_for_view_for_current_mails={data_for_view}
							data_images_from_max={data_images_from_max}
						></View_For_Images>
					}
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
									<Input_Default
										placeholder='Поиск...'
										value={search_text}
										onChange={(e)=>{set_search_text(e.target.value)}}
									></Input_Default>
								</div>
								<div>
									<Button_Default>
										Найти
									</Button_Default>
								</div>
							</div>
						</div>
					</div>
					{/* группа блоков */}
					<div className='blocks'>
						<div className='block-item'>
							<div className='header-mail-curr-name'>
								{/* имя с кем переписываешься */}
								{my_data !== null
								?
									curr_user.from !== my_data.id
									?
										curr_user.name_to_send === my_data.name ? `${curr_user.name_sender}` : curr_user.name_to_send ? curr_user.name_to_send : name_of_current_mail
									:
										curr_user.name_sender === my_data.name ? `${curr_user.name_to_send}` : `${curr_user.name_sender}`
								:
									null
								}
							</div>
							<div className='links_row'>
								<Button_Default onClick={()=>{navigate('/account/mail/')}}>
									Назад
								</Button_Default>
								{!pick_item 
								?
									<Button_Default onClick={()=>{set_pick_item(true)}}>Выбрать</Button_Default>
								:
									<div className='row-buttons'>
										<Button_Default onClick={()=>{remove_messages()}}>Удалить</Button_Default>
										<Button_Default onClick={()=>{set_pick_item(false); set_checked_items([])}}>Отменить</Button_Default>
									</div>
								}
							</div>
							<div className="in_bottom" onClick={()=>{to_bottom()}}>
								вниз
							</div>
							<div className="in_top" onClick={()=>{to_top()}}>
								{/* вверх */}
							</div>
							{mails.length > 0 && loading_page && sequrity
							?
								mails.map((mail, index)=>
									<div key={mail._id} className={`${mail.name_sender === my_data.name ? `user-message-row-right` : `user-message-row-left`}`}>
										<div className={checked_items.includes(mail._id) ? 'pick_item_checked' : 'pick_item'} onClick={()=>{add_id_into_picked_item(mail)}} style={{display: `${pick_item ? 'flex' : 'none'}`}} num={mail._id}>
											{/* check box */}
										</div>										{/* <div> */}
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
										{/* 		id mail = {`${mail._id}`}  */}
										{/* 	</div> */}
										{/* 	<div> */}
										{/* 		img = {`${mail.img}`}  */}
										{/* 	</div> */}
										{/* </div> */}
										<div className={`${mail.name_sender === my_data.name ? `user-message-i` : `user-message`}`} key={mail._id}>
											<div className='mail-body' onLoad={()=>{}}>
												<div className='row'>
													<div className='mail'>
														<div className='mail-icon'>
															{mail.from === my_data.id 
																? 
																	//моя аватарка
																	<img className="profil-avatar" src={profil_avatars.find(img => {
																		const raw_img_name = img.split('/')[3].split('.');
																		const img_name = raw_img_name[0] + '.' + raw_img_name[2];
																		return img_name === my_data.profil_avatar;
																	})}/>
																: 
																	//аватарка оппонента
																	<img className="profil-avatar" src={profil_avatars.find(img => {
																		const raw_img_name = img.split('/')[3].split('.');
																		const img_name = raw_img_name[0] + '.' + raw_img_name[2];
																		return img_name === other_data.other_avatar;
																	})} onClick={()=>{set_current_user(mail?.from === my_data?._id ? mail?.to : mail?.from); navigate(`/main/${mail?.from === my_data?._id ? mail?.to : mail?.from}/page`)}}/>
															}
														</div>
														<div className='mail-name'>
															{mail.name_sender} {mail.name_sender === my_data.name && ` (я)`}
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
														</div>
														<div className='current_mails_button_add_to_favourite_false' onClick={()=>{
															console.log('MAIL = ', JSON.parse(mail?.img));
															// console.log('images_from_max = ', images_from_max)
															add_favourites_for_mails(
																'mail',																	//type
																mail.from === my_data.id 												//аватарка
																?	
																	profil_avatars.find(img => {
																		const raw_img_name = img.split('/')[3].split('.');
																		const img_name = raw_img_name[0] + '.' + raw_img_name[2];
																		return img_name === my_data.profil_avatar;
																	})
																:
																	profil_avatars.find(img => {
																		const raw_img_name = img.split('/')[3].split('.');
																		const img_name = raw_img_name[0] + '.' + raw_img_name[2];
																		return img_name === other_data.other_avatar;
																	}),
																get_images_for_mail(mail?.img ? mail : false), 						// изображения
																mail._id, 															// id сообщения
																mail?.message || '',
																mail?.voice || null,
															)
														}}>
															{/* добавить в избранное */}
														</div>
													</div>
												</div>
												<div>
													<div className={ `mail-message ${user_select_id === mail._id ? user_select ? 'user-select' : null : null} `} num={mail._id}>
														{mail
														?	
															<Content_Block
																// types: [img],[text],[img_and_text]
																type={mail?.type} 
																// role={my_role}
																img={mail.img}
																text={mail?.message || ''}
																voice={mail?.voice || null}
																visiable={true}
																// posts_images={mail.img}
																// id={post?._id}
																// group_id={group_data?._id}
																curr_user={curr_user}
																refresh_posts={get_mails}
																date={mail?.date}
																changed={mail?.changed}
																user_page_id={null}
																hidden={false}
																// this_my_group={this_my_group}
																set_visiable_view_for_images={()=>{set_visiable_view_for_images(true)}}
																set_current_img_for_view={set_current_img_for_view}
																new_images_array={images_from_max}
																my_id={my_id}
																other_id={curr_user.from && curr_user.to ? my_data.id !== curr_user.from ? curr_user.from : curr_user.to : curr_user}
																mail_id={mail?._id}
																content_id_for_current_mails={mail?._id}
																for_current_mails={true}
																images_from_max={images_from_max}
																select_img_for_view={set_select_img_for_view_callback_func}
																normal_images_from_current_mails={normal_images_from_current_mails}
																data_images_from_max={data_images_from_max}
																this_my_message={mail.name_sender === my_data.name ? true : false}
																func_scroll_to_it_after_changed={func_scroll_to_it_after_changed_callback_func}
																ws_message_type={ws_message_type}
																ws_ref={ws_ref}
																mail={mail}
																my_data_mail={my_data}
															></Content_Block>
														: null}
													</div>
												</div>
											</div>
											<div className='mail-buttons'>
												<div className='remove-mail'>
													Удалить
												</div>
											</div>
										</div>
									</div>
								)
							:
								<div style={{
									display: 'inline-flex',
									justifyContent: 'center',
								}}>
									{is_loading
									?
										<div>писем нет</div>
									:
										<Loader></Loader>
									}
								</div>
							}
						</div>
					</div>
					<div className='row'>
						<div className="preview-img">
							{selected_files
							? 	
								<div className='row row-preview'>
									<div className="remove_all_previews" onClick={()=>{remove_preview(preview_url)}}>
										x
									</div>
									<div className="remove_all_previews" onClick={()=>{set_preview_max(true)}}>
										OPEN
									</div>
									<div className='preview'>
										<div className='preview-progress-loader'>
											<progress className='progress-bar' max="100" value='50'></progress>
										</div>
										<div className='preview-img-img'>
											<div className='preview-img-img-row'>
												{preview_url instanceof Array
												?
													preview_url.map((preview, index) =>
														<div key={index} className='preview-img-box'>
															<img src={preview} alt="Preview_Max"/>
															<div className="preview-img-remove" onClick={()=>{remove_preview_file(preview, index)}} src={preview_url}>
																x
															</div>
														</div>
														
													)
												:
													<div className='preview-img-box'>
														<img src={preview_url} alt="Preview_Max"/>
														<div className="preview-img-remove" onClick={()=>{set_selected_files('')}} src={preview_url}>
															x
														</div>
													</div>
												}
											</div>
										</div>
									</div>
								</div>
							: 
								null}
						</div>
					</div>
					<div className='block-sender'>
						{pick_files && 
							<div className=''>
								<Form_Create_New_Record
									close={set_pick_files}
									type={'all'}
									get_posts={get_mails}
									my_data={my_data}
									name_of_current_mail={name_of_current_mail}
									curr_user={curr_user}
									create_new_record={pick_files}
									text_for_current_mails={mail_text}
									set_text_for_current_mails={set_mail_text}
									for_current_mails={true}
									clear_text_after_send={set_mail_text}
									my_id={my_id}
									other_id={curr_user.from && curr_user.to ? my_data.id !== curr_user.from ? curr_user.from : curr_user.to : curr_user}
									ws_ref={ws_ref}
								></Form_Create_New_Record>
							</div>
						}
						<form action="" onSubmit={(e)=>{e.preventDefault()}}>
							<div className='form-row'>
								<div className="form-row-img" onClick={()=>{set_pick_files(true)}} style={{pointerEvents: recording_voice || voice_recorded ? 'none' : '', opacity: recording_voice || voice_recorded ? '0.2' : '1'}}>
									+
								</div>
								<div className='voice_recorder_button' style={{width: voice_recorded ? '100%' : 'auto'}}>
									<Voice_Recorder
										voice_recorded={voice_recorded}
										set_voice_recorded={set_voice_recorded}
										recording_voice={recording_voice}
										set_recording_voice={set_recording_voice}
										voice_sended={voice_sended}
										set_voice_sended={set_voice_sended}
										set_mail_text={set_mail_text}
										set_selected_files={set_selected_files}
										ws_ref={ws_ref}
									></Voice_Recorder>
								</div>
								{!voice_recorded &&
									<div className="form-row-message" style={{pointerEvents: recording_voice ? 'none' : '', opacity: recording_voice ? '0.2' : '1'}}>
										<textarea
											className='auto-grow'
											value={mail_text}
											placeholder='Напишите сообщение'
											onChange={(e)=>{set_mail_text(e.target.value)}}
										></textarea>
									</div>
								}
								<div className="form-row-submit" style={{pointerEvents: recording_voice || is_sending ? 'none' : '', opacity: recording_voice || is_sending ? '0.2' : '1'}}>
									<Button_Default type="button" disabled={is_sending || recording_voice} onClick={handle_send_click}>{is_sending ? 'Отправка…' : 'Отправить'}</Button_Default>
								</div>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	)
};

export default React.memo(Account_Current_Mails);