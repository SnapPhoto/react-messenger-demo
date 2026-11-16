import React, {useState, useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import cl from './content.module.css';
import $ from 'jquery';
import Content_Panel_Buttons from '../../components/content_panel_buttons/content_panel_buttons';
import axios from 'axios';
import Change_Content_Panel from '../../components/change_content/change_content.jsx';
// import FormChange_Content from '../../components/change_content/change_content.jsx';

function normalizePostImageGroups(images){
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
		if( Array.isArray(parsed) ) result.push(...parsed);
		else if( parsed && typeof parsed === 'object' ) result.push(parsed);
	}
	return result.length ? [result] : [];
}

export const Content_Block = ({type, role, img, data, id, text, visiable, posts_images, curr_user, group_id, refresh_posts, date, changed, user_id, hidden, this_my_page, this_my_group, set_visiable_view_for_images, set_current_img_for_view, new_images_array, visible_images, hidden_images, my_id, other_id, for_current_mails, images_from_max, select_img_for_view, normal_images_from_current_mails, data_images_from_max, mail_id, this_my_message, this_group_id, content_id_for_current_mails, func_scroll_to_it_after_changed, voice, post_for_main, normal_images_for_main_from_group, normal_images_for_main_from_user_page, this_user_page, this_group, ws_message_type, ws_ref, unique_token, for_user_page, mail, my_data_mail}) => {
	// types: [img],[text],[img_and_text]
	// this_user_page - показатель, что это страница; [true/false]
	// my_id - мой id;
	// other_id - id пользователя, с которым осуществляется переписка (в current_mails);


	const [remove, set_remove] = useState(false);
	const [options, set_options] = useState(false);
	const current_img = useRef(null);
	const [images, set_images] = useState([]);
	const [current_images, set_current_images] = useState([]);
	const [post_date, set_post_date] = useState(null);
	const [form_change_visiable, set_form_change_visiable] = useState(false);
	const [text_with_links, set_text_with_links] = useState([]);
	const [ normal_images, set_normal_images ] = useState([]); 

	const component_ref = useRef(null);

	const [this_my_mail, set_this_my_mail] = useState(true);

	function find_post_image(loaded_file){
		const basename = value => typeof value === 'string' ? value.split(/[\\/]/).pop() : '';
		const normalize_name = value => basename(value)?.replace(/["']/g, '');
		const candidates = [loaded_file?.name, loaded_file?.file_name, loaded_file?.full_name, loaded_file?.path, loaded_file?.file_path]
			.map(normalize_name).filter(Boolean);
		const matched_image = current_images.find(image =>
			[image?.name, image?.full_name, image?.file_name, image?.path]
				.map(normalize_name).filter(Boolean).some(asset_name => candidates.some(name => asset_name === name || asset_name.endsWith(`_${name}`)))
		);
		if( matched_image || !for_current_mails || candidates.length === 0 ) return matched_image;
		const filename = [loaded_file?.name, loaded_file?.file_name, loaded_file?.path, loaded_file?.file_path, loaded_file?.full_name]
			.map(normalize_name).find(name => /\.(jpg|jpeg|png|webp|gif)$/i.test(name));
		if( !filename ) return undefined;
		return {
			name: filename,
			full_name: loaded_file?.full_name || filename,
			path: `/images/max/${encodeURIComponent(filename)}`,
		};
	}

	function get_current_mail_image_src(loaded_file){
		return find_post_image(loaded_file)?.path || '';
	}

	function open_post_image(loaded_file, fallback_index){
		const asset = find_post_image(loaded_file);
		const full_name = loaded_file?.full_name || asset?.full_name || asset?.name;
		const is_hidden = hidden === true || hidden === 'true';
		const gallery = is_hidden ? hidden_images : visible_images;
		const gallery_image = (Array.isArray(gallery) ? gallery : []).find(image =>
			image?.name === full_name || image?.full_name === full_name
		);
		set_current_img_for_view({
			img: asset?.path,
			name: full_name,
			img_index: gallery_image?.index ?? fallback_index,
		});
		set_visiable_view_for_images(true);
	}

	useEffect(()=>{
		if( mail?._id ){
			if( mail.from === my_id ){
				set_this_my_mail('my')
			}
			else{
				set_this_my_mail('other')
			}
		}
	},[mail])

	useEffect(()=>{
		console.log('[normal_images_for_main_from_group] = ', normal_images_for_main_from_group);
	},[normal_images_for_main_from_group]);

	useEffect(()=>{
		console.log('[normal_images_for_main_from_user_page] = ', normal_images_for_main_from_user_page)	
	},[normal_images_for_main_from_user_page])

	useEffect(()=>{
		if( !for_current_mails	){
			console.log('this_my_page = ', this_my_page)
			console.log('this_my_group = ', this_my_group)
		}
	},[this_my_page, this_my_group])

	useEffect(()=>{
		set_text_with_links([])
		if( text && text.length > 0 ){
			const raw_text = text.split(' ');
			console.log('raw_text = ',raw_text);
			raw_text.forEach((r_text)=>{
				set_text_with_links(text_with_links => [...text_with_links, {
					link: (r_text.includes('https://') || r_text.includes('http://')) ? true : false,
					text: r_text,
				}])
			});
		}
	},[text]);

	useEffect(()=>{
		if( text_with_links.length > 0 ){
			console.log('[48] text_with_links = ',text_with_links)
		}
	},[text_with_links])

	useEffect(()=>{
		if( date !== null ){
			const raw_date = new Date(date);
			if( raw_date ){
				const year = raw_date.getFullYear();
				const month = raw_date.getMonth()+1;
				const day = raw_date.getDate();
				const hour = raw_date.getHours();
				const minute = raw_date.getMinutes();
				set_post_date({
					year: year,
					month: month,
					day: day,
					hour: hour,
					minute: minute,
				})
			}
		}
	},[date]);

	// useEffect(()=>{
	// 	if( images.length > 0 ){
	// 		images.forEach((img, index)=>{
	// 			console.log()
	// 			console.log(`img [${index}] = `);
	// 			console.log(img)
	// 		})
	// 	}
	// },[images])

	useEffect(()=>{
		if( img !== null && img !== undefined ){
			if( !for_current_mails ){
				set_images(normalizePostImageGroups(img));
			}
			else{
				function check_JSON(img){
					if( img ){
						try{
							const parse_json = JSON.parse(img);
							if( parse_json ){
								return true;
							}
						}
						catch(err){
							return false;
						}
					}
				};
				const check_is_JSON = check_JSON(img);
				// console.log('check_is_JSON = ', check_is_JSON);
				if( check_is_JSON ){
					const parsed_img = JSON.parse(img);
					// console.log('img_ = ', img);
					// console.log('parsed_img = ', parsed_img);
					if( img ){
						const normal_images = [];
						const parsed_imgs = JSON.parse(img);
						// console.log('[126] parsed_imgs = ', parsed_imgs);
						// return;
						parsed_imgs.map((i, index) => {
							// console.log('i.name = ', i?.data?.loaded_file?.name);
							normal_images.push(i)
						});
						// console.log('[132] normal_images = ', normal_images)
						if( normal_images.length > 0 ){
							set_images(normal_images);
						}
					}
				}
			}
		}
	},[img])

	useEffect(()=>{
		if( Array.isArray(posts_images) ){
			const image_data = posts_images.map(image => {
				if( image && typeof image === 'object' ) return image;
				if( typeof image !== 'string' ) return null;
				const filename = image.split('/').pop();
				const raw_data = filename?.split('_-_')[1] || filename;
				const last_dot_index = raw_data?.lastIndexOf('.') ?? -1;
				const prev_dot_index = raw_data?.lastIndexOf('.', last_dot_index - 1) ?? -1;
				const legacy_name = last_dot_index >= 0 && prev_dot_index >= 0
					? raw_data.slice(0, prev_dot_index) + raw_data.slice(last_dot_index)
					: filename;
				return {name: legacy_name, full_name: filename, path: image};
			}).filter(Boolean);
			set_current_images(image_data);
		}
	},[posts_images])

	// useEffect(()=>{
	// 	console.log('current_images = ', current_images)
	// },[current_images])
	useEffect(()=>{
		// console.log('[168] images = ', images)
	},[images])

	// УДАЛЕНИЕ КОНтЕНТА ДЛЯ ГРУППЫ
	async function remove_content_for_group(){
		const token = localStorage.getItem('token');
		if( !token ) return;
		try{
			const response = await axios.post('/remove_content', {
				content_id: id,
				group_id: group_id,
			}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.message ){
				console.log(response?.data?.message);
			};
			console.log(images)
			if( response?.data?.refresh ){
				// удаление файлов с сервера
				if( images.length > 0 ){
					images.forEach((rem_file) => {
						// console.log('rem_file = ',rem_file)
						rem_file.forEach( async file=>{
							try{
								const response_remove = await axios.post('/total_delete_img', {
									group_id: group_id,
									content_id: id,
									old_file: JSON.stringify(file?.data?.loaded_file),
								}, {
									headers: {
										Authorization: `Bearer ${token}`
									}
								})
							}
							catch(err){
								console.error('Ошибка удаления файла: ', err);
							};

							//удаление из новостного канала
							try{
								const response = await axios.post('/remove_news', {
									unique_token: unique_token
								}, {
									headers: {
										Authorization: `Bearer ${token}`
									}
								})
							}
							catch(err){
								throw err;
							}

							// удаление новостного поста (если есть)
							try{
								const response_remove_news = await axios.post('/remove_news', {
									group_id: group_id,
									content_id: id,
								}, {
									headers: {
										Authorization: `Bearer ${token}`
									}
								})
							}
							catch(err){
								throw err;
							}
						})
					})
				}
				refresh_posts();

				// обновление через websocket
				// НАСТРОИТЬ ПРИЁМ ЭТОГО СООБЩЕНИЯ + А ТАК ЖЕ ДЛЯ _ ДОБАВЛЕНИЯ НОВОЙ ЗАПИСИ _ + МОЖЕТ БЫТЬ ЕЩЁ ЧЕГО
				try{
					if( ws_ref.current !== null && ws_ref.current.readyState === 1 ){
						ws_ref.current.send(JSON.stringify({
							type: 'remove_content_for_group',
							group_id: group_id,
							content_id: id,
						}))
					}
				}
				catch(err){
					throw err;
				}
			}
		}
		catch(err){
			console.error('Ошибка удаления контента: ', err);
		}
	};


	// УДАЛЕНИЕ КОНТЕНТА ДЛЯ USER_PAGE
	async function remove_content_for_user_page(){
		const token = localStorage.getItem('token');
		if( !token ) return;
		try{
			const response = await axios.post('/remove_content_user_page', {
				content_id: id,
				user_page_id: user_id,
			}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.message ){
				console.log(response?.data?.message);
			};
			console.log(images)
			if( response?.data?.refresh ){
				// удаление файлов с сервера
				if( images.length > 0 ){
					images.forEach((rem_file) => {
						// console.log('rem_file = ',rem_file)
						rem_file.forEach( async file=>{
							try{
								const response_remove = await axios.post('/total_delete_img_for_user_page', {
									user_page_id: user_id,
									content_id: id,
									old_file: JSON.stringify(file?.data?.loaded_file),
								}, {
									headers: {
										Authorization: `Bearer ${token}`
									}
								});
								console.log('Total delete img complete!');
							}
							catch(err){
								console.error('Ошибка удаления файла: ', err);
							};

							//удаление из новостного канала
							try{
								const response = await axios.post('/remove_news', {
									unique_token: unique_token
								}, {
									headers: {
										Authorization: `Bearer ${token}`
									}
								})
							}
							catch(err){
								throw err;
							}
						})
					})
				}
				refresh_posts();
			}
		}
		catch(err){
			console.error('Ошибка удаления контента: ', err);
		}
	};

	// УДАЛЕНИЕ КОНТЕНТА ДЛЯ CURRENT_MAIL
	async function remove_content_for_current_mail(c,m,o){
		// c, m, o - для использования в других местах

		// c = content_id
		// m = my_id
		// o = other_id

		const token = localStorage.getItem('token');
		if( !token ) return;
		try{
			const response = await axios.post('/remove_content_current_mail', {
				content_id: id || c,
				my_id: my_id || m,
				other_id: other_id || o,
			}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.message ){
				console.log(response?.data?.message);
			};
			// console.log(images)
			if( response?.data?.refresh ){
				// удаление файлов с сервера
				if( images.length > 0 ){
					images.forEach((rem_file) => {
						console.log('rem_file = ',rem_file)
						rem_file.forEach( async file=>{
							try{
								const response_remove = await axios.post('/total_delete_img_for_user_page', {
									user_page_id: user_id,
									content_id: id,
									old_file: JSON.stringify(file?.data?.loaded_file),
								}, {
									headers: {
										Authorization: `Bearer ${token}`
									}
								});
								console.log('Total delete img complete!');
							}
							catch(err){
								console.error('Ошибка удаления файла: ', err);
							}
						})
					})
				}
				refresh_posts();
			}
		}
		catch(err){
			console.error('Ошибка удаления контента: ', err);
		}
	};

	async function hide_content_for_group(){
		const token = localStorage.getItem('token');
		if( !token ) return;
		try{
			const response = await axios.post('/hide_content_for_group', {
				group_id: group_id,
				content_id: id,
			}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.message ){
				console.log(response?.data?.message);
			};
			if( response?.data?.refresh ){
				refresh_posts();
			}
		}
		catch(err){
			console.error('Ошибка скрытия контента: ', err);
		}
	};

	async function hide_content_for_user_page(){
		const token = localStorage.getItem('token');
		if( !token ) return;
		try{
			const response = await axios.post('/hide_content_for_user_page', {
				user_page_id: user_id,
				content_id: id,
			}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.message ){
				console.log(response?.data?.message);
			};
			if( response?.data?.refresh === true ){
				await refresh_posts();
			}
			else if( response?.data?.error ){
				console.error('Сервер не изменил видимость поста: ', response.data.error);
			}
		}
		catch(err){
			console.error('Ошибка скрытия контента: ', err.response?.data || err);
		}
	};

	function change_content(){
		set_form_change_visiable(true)
	};

	async function add_favourites(type){
		console.log('374')
		console.log('ID контента = ', id);
		console.log('>> ', type === 'group' ? this_group_id : type === 'mail' && id);
		// return;
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		const images_from_this_content = () => {
			const this_images = [];
			if( images.length > 0 ){
				images.forEach((img, img_index) => {
					if( img.length > 0 ){
						img.forEach((i, index) => {
							this_images.push(find_post_image(i?.data?.loaded_file)?.path);
						})
					}
				})
			};
			if( this_images.length > 0 ){
				return this_images;
			}
		}
		// console.log('posts_images = ', posts_images);
		// console.log('new_images_array = ', new_images_array);
		// console.log('images = ', images);
		// console.log('current_images = ', current_images);
		// console.log('images_from_this_content = ', images_from_this_content());
		// console.log('_-_-_-_-_ images = ', images_from_this_content());
		// return;
		try{
			const content = {
				type: type,
				my_id: my_id,
				id: id, //id контента
				group_id: this_group_id,
				data: {
					images: JSON.stringify(images_from_this_content()) || null,
					text: text,
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
		if( for_current_mails ){
			if( images_from_max.length > 0 ){
				images_from_max.forEach((img)=>{
					const raw = img;
					// console.log('raw = ', raw)
					const raw_name = raw.split('/')[3].split('.')
					// console.log('raw_name = ', raw_name);
					const name = raw_name[0] + '.' + raw_name[2];
					// console.log('correct_name = ', name);
					if( name ){
						set_normal_images(normal_images => [...normal_images, {
							path: raw,
							raw_name: raw_name,
							name: name,
						}])
					}
				});
			}
		}
	},[images_from_max]);

	useEffect(()=>{
		if( normal_images_from_current_mails ){
			// console.log('[460] normal_images_from_current_mails = ', normal_images_from_current_mails)
		}
	},[normal_images_from_current_mails])

	// useEffect(()=>{
	// 	if( normal_images.length > 0 ){
	// 		console.log('normal_images = ', normal_images)
	// 	}
	// },[normal_images])

	async function change_mail_status(id){
		const token = localStorage.getItem('token')
		if( !token ){
			return;
		}
		try{
			// если статус не прочитано
			if( mail?.status === 'uncheck' && this_my_mail === 'other' ){
				const response = await axios.post('/mails/change_status',{
					mail: mail
				},{
					headers: {
						Authorization: `Bearer ${token}`
					}
				})
				if( response?.data?.change === 'ok' ){
					refresh_posts();

					// проброс через websocket
					if( ws_ref.current !== null && ws_ref.current.readyState === 1 ){
						ws_ref.current.send(JSON.stringify({
							type: 'change_status_for_mail',
							for: curr_user
						}));
					};
				}
			}
			else{
				console.log('НЕ МОГУ ИЗМЕНИТЬ СТАТУС! this_my_mail = ', this_my_mail)
			}
		}
		catch(err){
			console.error('Ошибка: ', err);
			return;
		}
	}

	useEffect(()=>{
		if( component_ref.current !== null ){
			const element = component_ref.current;
			if( !element ){ return; }
			const observer = new IntersectionObserver((entries)=>{
				const entry = entries[0]
				if( entry.isIntersecting ){
					// видно (прочитано)
					// сперва обновляем статус у поста
					change_mail_status(id);
				}
				else{
					// не видно
				}
			});
			observer.observe(element);
			return () => {
				observer.disconnect();
			};
		};
	},[this_my_mail, component_ref])

	return (
		<div ref={component_ref}
			className={
				type === 'img'
				?
					cl.content_img
				:
				type === 'text'
				?
					cl.content_text
				:
				type === 'img_and_text'
				?
					cl.content_img_and_text
				:
					''
			}
			content_id={id || content_id_for_current_mails}
		>	
			<div className={cl.mail_status}>
				{mail && mail.status === 'uncheck' ? <div className={cl.mail_status_uncheck}></div> : <div className={cl.mail_status_check}></div>}
			</div>	
			{form_change_visiable && createPortal(
				<Change_Content_Panel
					close={()=>{set_form_change_visiable(false)}}
					type={type}
					group_data={data}
					exist_text={text}
					curr_user={curr_user}
					images={images}
					images_from_max={images_from_max}
					id={user_id || group_id}
					content_id={id}
					content_id_for_current_mails={content_id_for_current_mails}
					get_posts={refresh_posts}
					old_text={text || ''}
					user_id={user_id}
					for_current_mails={for_current_mails}
					my_id={my_id}
					other_id={other_id}
					scroll_to_it_after_changed={func_scroll_to_it_after_changed}
					remove_content_for_current_mail={remove_content_for_current_mail}
					ws_message_type={ws_message_type}
					ws_ref={ws_ref}
				/>,
				document.body
			)}
			<div className={
				type === 'img'
				?
					cl.post_img
				:
				type === 'text'
				?
					cl.post_text
				:
				type === 'img_and_text'
				?
					cl.post_img_and_text
				:
					''
			}>
				{type === 'img' && !for_current_mails && !post_for_main && !for_user_page &&
					<div className={cl.forma}>
						<div className={cl.img_container}>
							{images.length > 0 &&
								images.map((img, index_img) =>	
									<div key={index_img} className={img.length === 1 ? cl.cell_one : cl.img_block}>
										<div className={cl.img_row} 
										style={{
											gridTemplateColumns: 
												img.length === 1 
												? 
													'minmax(10px, auto)' 
												: 
												img.length === 2
												?
													'repeat(2, minmax(10px, auto))'
												:
												img.length === 3
												?
													'repeat(3, minmax(10px, auto))'
												:
												img.length === 4
												?
													'repeat(2, minmax(10px, auto))'
												:	
												img.length === 5
												?
													'repeat(5, minmax(10px, auto))'
												:
												img.length === 6
												&&
													'repeat(3, minmax(10px, auto))'
											,
											aspectRatio:
											img.length === 5
											&&
												'1.5/0.4'
										}}
										>
											{img.map((i,index)=>
												(index >= 0 && index < 2)
												?	
													<div key={i?.data?.loaded_file?.full_name} className={cl.img}>
														<img onClick={()=>open_post_image(i?.data?.loaded_file, index)} src={find_post_image(i?.data?.loaded_file)?.path}/>
													</div>
												:
												(index >= 2 && index < 4)
												?
													<div key={i?.data?.loaded_file?.full_name} className={cl.img}>
														<img onClick={()=>open_post_image(i?.data?.loaded_file, index)} src={find_post_image(i?.data?.loaded_file)?.path}/>
													</div>
												:
												(index >= 4 && index < 6)
												&&
													<div key={i?.data?.loaded_file?.full_name} className={cl.img}>
														<img onClick={()=>open_post_image(i?.data?.loaded_file, index)} src={find_post_image(i?.data?.loaded_file)?.path}/>
													</div>
											)}
										</div>
									</div>
								)
							}
						</div>
					</div>
				}
				{type === 'text' && !for_current_mails && !post_for_main && !for_user_page && 
					<div className={cl.forma}>
						<div className={cl.text}>
							{/* {unique_token || 'пусто'} */}
							{text_with_links.map((text, index)=>
								text?.link
								?
								<a key={index} href={text?.text}> {text?.text.length > 100 ? text?.text.slice(0, 100) + '...' : text?.text} </a>
								:
								<span key={index}> {text?.text} </span>
							)}
						</div>
					</div>
				}
				{type === 'img_and_text' && !for_current_mails && !post_for_main && !for_user_page &&
					<div className={cl.forma}>
						<div className={cl.img_container}>
							{images.length > 0 &&
								images.map((img, index_img) =>	
									<div key={index_img} className={img.length === 1 ? cl.cell_one : cl.img_block}>
										<div className={cl.img_row} 
										style={{
											gridTemplateColumns: 
												img.length === 1 
												? 
													'minmax(10px, auto)' 
												: 
												img.length === 2
												?
													'repeat(2, minmax(10px, auto))'
												:
												img.length === 3
												?
													'repeat(3, minmax(10px, auto))'
												:
												img.length === 4
												?
													'repeat(2, minmax(10px, auto))'
												:	
												img.length === 5
												?
													'repeat(5, minmax(10px, auto))'
												:
												img.length === 6
												&&
													'repeat(3, minmax(10px, auto))'
											,
											aspectRatio:
											img.length === 5
											&&
												'1.5/0.4'
										}}
										>
											{img.map((i,index)=>
												(index >= 0 && index < 2)
												?	
													<div key={i?.data?.loaded_file?.full_name} className={cl.img}>
														<img onClick={()=>open_post_image(i?.data?.loaded_file, index)} src={find_post_image(i?.data?.loaded_file)?.path} alt="картинка"/>
													</div>
												:
												(index >= 2 && index < 4)
												?
													<div key={i?.data?.loaded_file?.full_name} className={cl.img}>
														<img onClick={()=>open_post_image(i?.data?.loaded_file, index)} src={find_post_image(i?.data?.loaded_file)?.path} alt="картинка"/>
													</div>
												:
												(index >= 4 && index < 6)
												&&
													<div key={i?.data?.loaded_file?.full_name} className={cl.img}>
														<img onClick={()=>open_post_image(i?.data?.loaded_file, index)} src={find_post_image(i?.data?.loaded_file)?.path} alt="картинка"/>
													</div>
											)}
										</div>
									</div>
								)
							}
						</div>
						<div className={cl.text}>
							{text}
						</div>
					</div>
				}

				{/* ДЛЯ СООБЩЕНИЙ */}
				{type === 'img' && for_current_mails && !post_for_main && !for_user_page &&
					<div className={cl.forma}>
						<div className={cl.img_container_for_current_mails}>
							{images.length > 0 &&
								<div key={Date.now()} className={images.length === 1 ? cl.cell_one : cl.img_block}>
									<div className={cl.img_row_for_current_mails} 
									style={{
										gridTemplateColumns: 
											images.length === 1 
											? 
												'minmax(10px, auto)' 
											: 
											images.length === 2
											?
												'repeat(2, minmax(10px, auto))'
											:
											images.length === 3
											?
												'repeat(3, minmax(10px, auto))'
											:
											images.length === 4
											?
												'repeat(2, minmax(10px, auto))'
											:	
											images.length === 5
											?
												'repeat(5, minmax(10px, auto))'
											:
											images.length === 6
											&&
												'repeat(3, minmax(10px, auto))'
										,
										aspectRatio:
										images.length === 5
										&&
											'1.5/0.4'
									}}
									>	
										{images.map((i,index)=>
											(index >= 0 && index < 2)
											?	
												<div key={i?.data?.loaded_file?.name} className={cl.img}>
													<img width={400} height={400} onClick={()=>{select_img_for_view(i, index, images, images_from_max); set_visiable_view_for_images(true)}} src={get_current_mail_image_src(i?.data?.loaded_file)}/>
													{/* 
														i = изображение, 
														index = индекс изображения, 
														images = все изображения поста, 
														images_from_max = все изображения из папки 
													*/}
												</div>
											:
											(index >= 2 && index < 4)
											?
												<div key={i?.data?.loaded_file?.name} className={cl.img}>
													<img loading="lazy" width={400} height={400} onClick={()=>{select_img_for_view(i, index, images, images_from_max); set_visiable_view_for_images(true)}} src={get_current_mail_image_src(i?.data?.loaded_file)}/>
												</div>
											:
											(index >= 4 && index < 6)
											&&
												<div key={i?.data?.loaded_file?.name} className={cl.img}>
													<img loading="lazy" width={400} height={400} onClick={()=>{select_img_for_view(i, index, images, images_from_max); set_visiable_view_for_images(true)}} src={get_current_mail_image_src(i?.data?.loaded_file)}/>
												</div>
										)}
									</div>
								</div>
							}
						</div>
					</div>
				}
				{type === 'img_and_text' && for_current_mails && !post_for_main && !for_user_page && 
					<div className={cl.forma}>
						{/* контент id = {content_id_for_current_mails} */}
						<div className={cl.img_container_for_current_mails}>
							{images.length > 0 &&
								<div key={Date.now()} className={images.length === 1 ? cl.cell_one : cl.img_block}>
									<div className={cl.img_row_for_current_mails} 
									style={{
										gridTemplateColumns: 
											images.length === 1 
											? 
												'minmax(10px, auto)' 
											: 
											images.length === 2
											?
												'repeat(2, minmax(10px, auto))'
											:
											images.length === 3
											?
												'repeat(3, minmax(10px, auto))'
											:
											images.length === 4
											?
												'repeat(2, minmax(10px, auto))'
											:	
											images.length === 5
											?
												'repeat(5, minmax(10px, auto))'
											:
											images.length === 6
											&&
												'repeat(3, minmax(10px, auto))'
										,
										aspectRatio:
										images.length === 5
										&&
											'1.5/0.4'
									}}
									>	
										{images.map((i,index)=>
											(index >= 0 && index < 2)
											?	
												<div key={i?.data?.loaded_file?.name} className={cl.img}>
													<img loading="lazy" width={400} height={400} onClick={()=>{select_img_for_view(i, index, images, images_from_max); set_visiable_view_for_images(true)}} src={get_current_mail_image_src(i?.data?.loaded_file)}/>
												</div>
											:
											(index >= 2 && index < 4)
											?
												<div key={i?.data?.loaded_file?.name} className={cl.img}>
													<img loading="lazy" width={400} height={400} onClick={()=>{select_img_for_view(i, index, images, images_from_max); set_visiable_view_for_images(true)}} src={get_current_mail_image_src(i?.data?.loaded_file)}/>
												</div>
											:
											(index >= 4 && index < 6)
											&&
												<div key={i?.data?.loaded_file?.name} className={cl.img}>
													<img loading="lazy" width={400} height={400} onClick={()=>{select_img_for_view(i, index, images, images_from_max); set_visiable_view_for_images(true)}}  src={get_current_mail_image_src(i?.data?.loaded_file)}/>
												</div>
										)}
									</div>
								</div>
							}
						</div>
						<div className={cl.text}>
							{text}
						</div>
					</div>
				} 
				{type === 'text' && for_current_mails && !post_for_main && !for_user_page &&
					<div className={cl.forma}>
						{/* контент id = {content_id_for_current_mails} */}
						<div className={cl.text}>
							{text_with_links.map((text, index)=>
								text?.link
								?
								<a key={index} href={text?.text}> {text?.text.length > 100 ? text?.text.slice(0, 100) + '...' : text?.text} </a>
								:
								<span key={index}> {text?.text} </span>
							)}
						</div>
					</div>
				}

				{/* ДЛЯ НОВОСТНЫХ ПОСТОВ */}

				{type === 'img' && post_for_main && 
					<div className={cl.forma}>
						<div className={cl.img_container}>
							{/* {unique_token} */}
							{images.length > 0 &&
								images.map((img, index_img) =>	
									<div key={index_img} className={img.length === 1 ? cl.cell_one : cl.img_block}>
										<div className={cl.img_row} 
										style={{
											gridTemplateColumns: 
												img.length === 1 
												? 
													'minmax(10px, auto)' 
												: 
												img.length === 2
												?
													'repeat(2, minmax(10px, auto))'
												:
												img.length === 3
												?
													'repeat(3, minmax(10px, auto))'
												:
												img.length === 4
												?
													'repeat(2, minmax(10px, auto))'
												:	
												img.length === 5
												?
													'repeat(5, minmax(10px, auto))'
												:
												img.length === 6
												&&
													'repeat(3, minmax(10px, auto))'
											,
											aspectRatio:
											img.length === 5
											&&
												'1.5/0.4'
										}}
										>
											{img.map((i,index)=>
												(index >= 0 && index < 2)
												?	
													<div key={i?.data?.loaded_file?.full_name} className={cl.img}>
														{ !for_user_page 
															?
																<img onClick={()=>{select_img_for_view(i, index, images, normal_images_for_main_from_group); set_visiable_view_for_images(true)}} src={normal_images_for_main_from_group.find(c => c?.name === i?.data?.loaded_file?.full_name)?.path} alt={''}/>
															:
																<img onClick={()=>{select_img_for_view(i, index, images, normal_images_for_main_from_user_page); set_visiable_view_for_images(true)}} src={normal_images_for_main_from_user_page.find(c => c?.name === i?.data?.loaded_file?.full_name)?.path} alt={''}/>
														}
													</div>
												:
												(index >= 2 && index < 4)
												?
													<div key={i?.data?.loaded_file?.full_name} className={cl.img}>
														{ !for_user_page 
															?
																<img onClick={()=>{select_img_for_view(i, index, images, normal_images_for_main_from_group); set_visiable_view_for_images(true)}} src={normal_images_for_main_from_group.find(c => c?.name === i?.data?.loaded_file?.full_name)?.path} alt={''}/>
															:
																<img onClick={()=>{select_img_for_view(i, index, images, normal_images_for_main_from_user_page); set_visiable_view_for_images(true)}} src={normal_images_for_main_from_user_page.find(c => c?.name === i?.data?.loaded_file?.full_name)?.path} alt={''}/>
														}
													</div>
												:
												(index >= 4 && index < 6)
												&&	normal_images_for_main_from_group.length > 0 &&
													<div key={i?.data?.loaded_file?.full_name} className={cl.img}>
														{ !for_user_page 
															?
																<img onClick={()=>{select_img_for_view(i, index, images, normal_images_for_main_from_group); set_visiable_view_for_images(true)}} src={normal_images_for_main_from_group.find(c => c?.name === i?.data?.loaded_file?.full_name)?.path} alt={''}/>
															:
																<img onClick={()=>{select_img_for_view(i, index, images, normal_images_for_main_from_user_page); set_visiable_view_for_images(true)}} src={normal_images_for_main_from_user_page.find(c => c?.name === i?.data?.loaded_file?.full_name)?.path} alt={''}/>
														}
													</div>
											)}
										</div>
									</div>
								)
							}
						</div>
					</div>
				}
				{type === 'text' && post_for_main &&
					<div className={cl.forma}>
						<div className={cl.text}>
							{text_with_links.map((text, index)=>
								text?.link
								?
								<a key={index} href={text?.text}> {text?.text.length > 100 ? text?.text.slice(0, 100) + '...' : text?.text} </a>
								:
								<span key={index}> {text?.text} </span>
							)}
						</div>
					</div>
				}
				{type === 'img_and_text' && post_for_main &&
					<div className={cl.forma}>
						<div className={cl.img_container}>
							{images.length > 0 &&
								images.map((img, index_img) =>	
									<div key={index_img} className={img.length === 1 ? cl.cell_one : cl.img_block}>
										<div className={cl.img_row} 
										style={{
											gridTemplateColumns: 
												img.length === 1 
												? 
													'minmax(10px, auto)' 
												: 
												img.length === 2
												?
													'repeat(2, minmax(10px, auto))'
												:
												img.length === 3
												?
													'repeat(3, minmax(10px, auto))'
												:
												img.length === 4
												?
													'repeat(2, minmax(10px, auto))'
												:	
												img.length === 5
												?
													'repeat(5, minmax(10px, auto))'
												:
												img.length === 6
												&&
													'repeat(3, minmax(10px, auto))'
											,
											aspectRatio:
											img.length === 5
											&&
												'1.5/0.4'
										}}
										>
											{img.map((i,index)=>
												(index >= 0 && index < 2)
												?	
													<div key={i?.data?.loaded_file?.full_name} className={cl.img}>
														<img onClick={()=>{select_img_for_view(i, index, images, normal_images_for_main_from_group); set_visiable_view_for_images(true)}} src={normal_images_for_main_from_group.find(c => c?.name === i?.data?.loaded_file?.full_name)?.path}/>
													</div>
												:
												(index >= 2 && index < 4)
												?
													<div key={i?.data?.loaded_file?.full_name} className={cl.img}>
														<img onClick={()=>{select_img_for_view(i, index, images, normal_images_for_main_from_group); set_visiable_view_for_images(true)}} src={normal_images_for_main_from_group.find(c => c?.name === i?.data?.loaded_file?.full_name)?.path}/>
													</div>
												:
												(index >= 4 && index < 6)
												&&	normal_images_for_main_from_group.length > 0 &&
													<div key={i?.data?.loaded_file?.full_name} className={cl.img}>
														<img onClick={()=>{select_img_for_view(i, index, images, normal_images_for_main_from_group); set_visiable_view_for_images(true)}} src={normal_images_for_main_from_group.find(c => c?.name === i?.data?.loaded_file?.full_name)?.path}/>
													</div>
											)}
										</div>
									</div>
								)
							}
						</div>
						<div className={cl.text}>
							{text}
						</div>
					</div>
				}

				<div className={cl.data}>
					<div className={cl.data_data}>
						{post_date &&
							post_date?.year + '/' +
							post_date?.month + '/' +
							post_date?.day + '/' +
							post_date?.hour + 'ч'
						}
					</div>
					<div className={cl.data_changed}>
						{post_date &&
							changed && ' (отредактировано)'
						}
					</div>
				</div>
			</div>
			{
				options
				?
					<div className={cl.option_true}>
						<div className={cl.option_true_hide}>
							...
						</div>
						<div>
							<Content_Panel_Buttons
								close={set_options}
								this_remove={user_id ? remove_content_for_user_page : group_id ? remove_content_for_group : for_current_mails && remove_content_for_current_mail}
								this_change={change_content}
								this_hide={user_id ? hide_content_for_user_page : group_id && hide_content_for_group}
								hidden={hidden}
								this_user_page={this_user_page}
								this_group={this_group}
								this_my_page={this_my_page || this_my_group}
								add_to_favourite={add_favourites}
								for_current_mails={for_current_mails}
								group_id={group_id}
								mail_id={mail_id ? mail_id : null}
								this_my_message={this_my_message}
								ws_message_type={ws_message_type}
								ws_ref={ws_ref}
							></Content_Panel_Buttons>
						</div>
					</div>
				: 	
					(group_id || this_user_page || this_my_message) && !voice && (this_user_page || this_group || this_my_message || hidden) &&
					<div className={cl.option_false} onClick={()=>{set_options(true)}}>
						...
					</div>
			}
			{/* Если есть голосовое */}
			{voice &&
				<audio controls src={`/voice/${voice}`}></audio>
			}
		</div>
	);
};

export default React.memo(Content_Block);