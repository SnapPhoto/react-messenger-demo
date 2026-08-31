import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams} from 'react-router-dom';
import '../../../App.css';
import cl from './main.module.css';
import App_Router from '../../../app_router/app_router';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Invites_Page from '../invites_page/invites_page.jsx';
import Content_Block from '../../../components/content/content';
import View_For_Images from '../../../components/view_for_images/view_for_images.jsx';
import Notification_Bar from '../../../components/notification_bar/notification_bar.jsx';
 
export const Main = ({my_id, visiable_panel_with_invites, set_visiable_panel_with_invites, ws_message_type, my_name}) => {

	const [ id, set_id ] = useState(null);
	const [ all_posts, set_all_posts ] = useState([]);
	const [ posts, set_posts ] = useState([]); // все новостные посты
	const [ posts_friends, set_posts_friends ] = useState([]); // новостные посты друзей
	const [ allow_posts, set_allow_posts ] = useState([]); // новостные посты групп, в которых выполнен вход
	const [ other_posts, set_other_posts ] = useState([]); // новостные посты из открытых групп, в которых не выполнен вход
	const [ type_news, set_type_news ] = useState('groups'); // groups, friends, other

	const [ images, set_images ] = useState(null);

	const [ normal_images_for_main_from_group, set_normal_images_for_main_from_group ] = useState([]);
	const [ normal_images_for_main_from_user_page, set_normal_images_for_main_from_user_page ] = useState([]);

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

	const [ images_from_max, set_images_from_max ] = useState([]);
	const [ data_images_from_max, set_data_images_from_max ] = useState([]);

	async function get_my_id(){
		const token = localStorage.getItem('token');
		if( !token ){
			return console.error('Ошибка токена');
		};
		try{
			const response = await axios.post('http://localhost:8080/get_user_data', {}, {
				headers: {
					Authorization: `Bearer ${token}`,
				}
			});
			if( response?.data?.my_id ){
				set_id(response?.data?.my_id);
			};
		}
		catch(err){
			return console.error('Ошибка: ', err);
		}
	};	

	useEffect(()=>{
		if( !my_id || my_id === undefined || my_id === null ){
			get_my_id()
		}
	},[my_id])

// 	async function clear_server(){
// 		try{
// 			const response = await axios.post('http://localhost:8080/clear_server', {}, {});
// 		}
// 		catch(err){
// 			console.error('Ошибка очистки сервера: ', err);
// 		}
// 	};
// 
// 	useEffect(()=>{
// 		clear_server();
// 	},[])

	function select_img_for_view(img, img_index, images, all_images){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		if( img ){
			console.log('******* img = ', img);
		};
		if( img_index !== null ){
			console.log('******* img_index = ', img_index);
		};
		if( images ){
			console.log('******* images = ', images);
		};
		const unique_normal_images_from_current_mails = new Set();
		const array_normal_images_from_current_mails = [];
		if( all_images === undefined || all_images.length === 0 || all_images === null ){
			return;
		};

		// для групп

		if( normal_images_for_main_from_group.length > 0 ){
			console.log('[105] normal_images_for_main_from_group = ', normal_images_for_main_from_group)
			const founded_images = [];
			images.forEach((image, index)=>{

				console.log('image = ', image)
				image?.map((img)=>{
					const founded_image = normal_images_for_main_from_group.find(arr_image => arr_image.name === img?.data?.loaded_file?.full_name);
					if( founded_image ){

						console.log('founded_image = true')

						founded_images.push(founded_image);
					}
					else{
						console.log('else => image...name = ', image[0]?.data?.loaded_file?.full_name);
						console.log('=> array_normal_images_from_current_mails...name => ', normal_images_for_main_from_group[0]?.name)
					}
				})
			});
			if( founded_images.length > 0 ){
				set_normal_images_from_current_mails(founded_images);
				set_data_for_view({
					current_img: img,
					current_img_index: img_index,
					images: founded_images,
					normal_images_for_main_from_group: normal_images_for_main_from_group,
				})
			};
		}

		// для user_page контента

		if( normal_images_for_main_from_user_page.length > 0 ){
			console.log('[138] normal_images_for_main_from_user_page = ', normal_images_for_main_from_user_page)
			const founded_images = [];
			images.forEach((image, index)=>{

				console.log('[image] = ', image)
				image?.map((img)=>{
					const founded_image = normal_images_for_main_from_user_page.find(arr_image => arr_image.name === img?.data?.loaded_file?.full_name);
					if( founded_image ){

						console.log('founded_image = true')

						founded_images.push(founded_image);
					}
					else{
						console.log('else => image...name = ', image[0]?.data?.loaded_file?.full_name);
						console.log('=> array_normal_images_for_main_from_user_page...name => ', normal_images_for_main_from_user_page[0]?.name)
					}
				})
			});
			if( founded_images.length > 0 ){
				set_normal_images_from_current_mails(founded_images);
				set_data_for_view({
					current_img: img,
					current_img_index: img_index,
					images: founded_images,
					normal_images_for_main_from_group: normal_images_for_main_from_user_page,
				})
			};
		}
	};

	async function get_posts(){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('http://localhost:8080/get_posts_for_main_page', {}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.posts ){
				console.log('Посты получены! :D');
				console.log('Новостные посты: ', response?.data?.posts);
				set_posts(response?.data?.posts);
				set_all_posts(all_posts=>[...all_posts, response?.data?.posts]);
			}
			else{
				console.log('Новостных постов нет :(');
			};
			if( response?.data?.posts_friends ){
				console.log('Посты друзей получены! :D');
				console.log('Новостные посты друзей: ', response?.data?.posts_friends);
				set_posts_friends(response?.data?.posts_friends);
				set_all_posts(all_posts=>[...all_posts, response?.data?.posts_friends]);

			};
			if( response?.data?.posts_from_entered_groups ){
				console.log('Новостные посты групп, в которых выполнен вход, получены!');
				console.log('')
				set_allow_posts(response?.data?.posts_from_entered_groups);
			};
			if( response?.data?.posts_other ){
				console.log('Новостные посты открытых групп, в которых не выполнен вход, получены!: ', response?.data?.posts_other);
				console.log('')
				set_other_posts(response?.data?.posts_other);
			}
		}
		catch(err){
			return console.error('Ошибка получения новостных постов: ', err);
		};
	};

	async function clear_posts(){
		try{
			const response = await axios.post('http://localhost:8080/clear_posts_for_main_page', {}, {});
		}
		catch(err){
			return console.log('Ошибка очистки постов: ', err)
		}
	};

	useEffect(()=>{
		console.log('посты = ', posts)
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};

		// для групп
		try{
			if( posts.length > 0 ){
				posts.forEach((post, index)=>{
					if( !post?.id_who_sended ){
						return;
					}
					const files = (context) => context.keys().filter(folder=>folder.includes(post?.from)).map(context);
					const images = files(require.context('../../../../src/images/groups_images/', true, /\.(jpg)$/i));
					if( images.length > 0 ){
						console.log(`[${index}] images = `, images)
						images.forEach((image)=>{
							const raw_path = image?.split('/')[3];
							console.log('raw_path = ', raw_path)
							const img_name = raw_path.split('.')[0] + '.' + raw_path?.split('.')[2];
							if( img_name ){
								set_normal_images_for_main_from_group(normal_images_for_main_from_group => [...normal_images_for_main_from_group, {
									path: image,
									raw_name: raw_path,
									name: img_name,
								}])
							}
						});
					};
				})
			}
		}
		catch(err){
			console.error('Ошибка загрузки изображений группы', err)
		};

		// для user_page
		try{
			if( posts.length > 0 ){
				posts.forEach((post, index)=>{
					if( !post?.id_who_sended ){
						return;
					}
					const files = (context) => context.keys().filter(folder=>folder.includes(post?.from)).map(context);
					const images = files(require.context('../../../../src/images/user_page_images/', true, /\.(jpg)$/i));
					if( images.length > 0 ){
						console.log(`[${index}] images = `, images)
						images.forEach((image)=>{
							const raw_path = image?.split('/')[3];
							console.log('raw_path = ', raw_path)
							const img_name = raw_path.split('.')[0] + '.' + raw_path?.split('.')[2];
							if( img_name ){
								set_normal_images_for_main_from_user_page(normal_images_for_main_from_user_page => [...normal_images_for_main_from_user_page, {
									path: image,
									raw_name: raw_path,
									name: img_name,
								}])
							}
						});
					};
				})
			}
		}
		catch(err){
			console.error('Ошибка загрузки изображений группы', err)
		}
	},[posts]);

	useEffect(()=>{
		get_posts();
		// очиситка всех новостных постов (применяется исключительно для тестировки)
		// clear_posts();
	},[])

	useEffect(()=>{
		if( posts_friends.length > 0 ){
			console.log('ПОСТЫ ДРУЗЕЙ::: ', posts_friends)
		}
	},[posts_friends]);

	return (
		<div className={cl.main_default}>
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
							<Link className='link' to={`/main/${id}/page`}> Моя страница </Link>
							<Link className='link' to='/main/peoples'> Люди </Link>
							<Link className='link' to='/main/friends'> Друзья <Notification_Bar type={'friends'} ws_message_type={ws_message_type} my_id={my_id} my_name={my_name}></Notification_Bar></Link>
							<Link className='link' to='/account/mail'> Сообщения <Notification_Bar type={'mails'} ws_message_type={ws_message_type} my_id={my_id} my_name={my_name}></Notification_Bar></Link>
							<Link className='link' to='/main/groups'> Группы </Link>
							<Link className='link' to={`/main/${id}/favourites`}> Избранное </Link>
							{/* <Link className='link' to=''> Уведомления </Link>   */}
							<Link className='link' onClick={()=>{set_visiable_panel_with_invites(true)}}> Приглашения <Notification_Bar type={'invites'} ws_message_type={ws_message_type} my_id={my_id} my_name={my_name}></Notification_Bar></Link>
						</div>
					</div>
				</div>
				<div className='split'>
					{/* разделение */}
				</div>
				{/* просмотр изображений */}
				{visiable_view_for_images &&
					<View_For_Images
						images={all_posts}
						current_img={null}
						close={()=>{set_data_for_view(null); set_visiable_view_for_images(false)}}
						visible_arhiv={null}
						type_arhiv={'bottom'}
						posts={all_posts}
						hidden_posts={'false'}
						type_view={'main'}
						visible_images={normal_images_for_main_from_group}
						hidden_images={null}
						for_current_mails={true}
						images_for_current_mails={null}
						images_from_max={images_from_max}
						normal_images_from_current_mails={[]}
						normal_images_for_main_from_group={normal_images_for_main_from_group}
						normal_images_for_main_from_user_page={normal_images_for_main_from_user_page}
						data_for_view_for_current_mails={data_for_view}
						data_images_from_max={data_images_from_max}
						type_news={type_news}
					></View_For_Images>
				}
				<div className='col-6'>
					{/* панель с Приглашениями / Уведомлениями */}
					{visiable_panel_with_invites &&
						<Invites_Page
							close={()=>{set_visiable_panel_with_invites(false)}}
						></Invites_Page>
					}
					{/* группа блоков */}
					<div className={cl.header_text}>
						Новостная лента
					</div>
					<div className={cl.buttons}>
						<div className={type_news === 'other' ? cl.button_active : cl.button} onClick={()=>{set_type_news('other')}}>
							Другие новости
						</div>
						<div className={cl.split}>
							{/* разделитель */}
						</div>
						<div className={type_news === 'groups' ? cl.button_active : cl.button} onClick={()=>{set_type_news('groups')}}>
							Новости групп
						</div>
						<div className={cl.split}>
							{/* разделитель */}
						</div>
						<div className={type_news === 'friends' ? cl.button_active : cl.button} onClick={()=>{set_type_news('friends')}}>
							Новости друзей
						</div>
					</div>
					<div className='split-maxima'>
						{/* разделитель */}
					</div>
					{type_news === 'groups'
					?	
						allow_posts.length > 0
						?
							<div className={cl.block_with_contents}>
								{allow_posts.slice().reverse().map((post)=>
									<div className={cl.content} key={post?._id}>
										<Content_Block
											// types: [img],[text],[img_and_text]
											type={post?.type_post} 
											role={null}
											img={post?.images}
											text={post?.text}
											visiable={true}
											posts_images={null}
											id={post?._id}
											group_id={null}
											refresh_posts={get_posts}
											date={post?.date}
											changed={post?.changed}
											user_page_id={null}
											hidden={false}
											this_my_group={false}
											set_visiable_view_for_images={()=>{set_visiable_view_for_images(true)}}
											set_current_img_for_view={set_current_img_for_view}
											select_img_for_view={select_img_for_view}
											new_images_array={new_images_array}
											my_id={id}
											this_group_id={null}
											post_for_main={true}
											normal_images_for_main_from_group={normal_images_for_main_from_group}
											unique_token={post?.unique_token || ''}
										></Content_Block>
									</div>
								)}
							</div>
						:
							'Новостей нет'
					:
					type_news === 'friends' 
					?
						posts_friends.length > 0
						?
							<div className={cl.block_with_contents}>
								{Array.from(posts_friends).slice().reverse().map((post)=>
									<div className={cl.content} key={post?._id}>
										<Content_Block
											// types: [img],[text],[img_and_text]
											type={post?.type_post} 
											role={null}
											img={post?.images}
											text={post?.text}
											visiable={true}
											posts_images={null}
											id={post?._id}
											group_id={null}
											refresh_posts={get_posts}
											date={post?.date}
											changed={post?.changed}
											user_page_id={null}
											hidden={false}
											this_my_group={false}
											set_visiable_view_for_images={()=>{set_visiable_view_for_images(true)}}
											set_current_img_for_view={set_current_img_for_view}
											select_img_for_view={select_img_for_view}
											new_images_array={new_images_array}
											my_id={id}
											this_group_id={null}
											post_for_main={true}
											normal_images_for_main_from_group={normal_images_for_main_from_group}
											normal_images_for_main_from_user_page={normal_images_for_main_from_user_page}
											for_user_page={true}
											unique_token={post?.unique_token || ''}
										></Content_Block>
									</div>
								)}
							</div>
						:
							'Новостей нет'
					:	
					type_news === 'other' &&
						Array.from(other_posts).length > 0
						?
							<div className={cl.block_with_contents}>
								{Array.from(other_posts)[0].slice().reverse().map((post)=>
									<div className={cl.content} key={post?._id}>
										<Content_Block
											// types: [img],[text],[img_and_text]
											type={post?.type_post} 
											role={null}
											img={post?.images}
											text={post?.text}
											visiable={true}
											posts_images={null}
											id={post?._id}
											group_id={null}
											refresh_posts={get_posts}
											date={post?.date}
											changed={post?.changed}
											user_page_id={null}
											hidden={false}
											this_my_group={false}
											set_visiable_view_for_images={()=>{set_visiable_view_for_images(true)}}
											set_current_img_for_view={set_current_img_for_view}
											select_img_for_view={select_img_for_view}
											new_images_array={new_images_array}
											my_id={id}
											this_group_id={null}
											post_for_main={true}
											normal_images_for_main_from_group={normal_images_for_main_from_group}
											unique_token={post?.unique_token || ''}
										></Content_Block>
									</div>
								)}
							</div>
						:
							'Новостей нет'				
					}
				</div>
				<div className='col-2'>
					
				</div>
			</div>
		</div>
	)
};

export default Main;