import React, {useState, useEffect} from 'react';
import cl from './favoutites.module.css';
import { Link, useNavigate, useParams} from 'react-router-dom';
import Invites_Page from '../invites_page/invites_page.jsx';
import axios from 'axios';
import View_For_Images from '../../../components/view_for_images/view_for_images.jsx';
import Content_Block from '../../../components/content/content.jsx';
import Notification_Bar from '../../../components/notification_bar/notification_bar.jsx';

export const Favourites = ({visiable_panel_with_invites, set_visiable_panel_with_invites, ws_message_type, ws_ref, my_id, my_name}) => {

	// const my_id = useParams('my_id');
	const [ avatars, set_avatars ] = useState([]);
	const [ type, set_type ] = useState('all');
	const [ favourites, set_favourites ] = useState([]);
	const [ favourite_with_type_user_page, set_favourite_with_type_user_page ] = useState([]);
	const [ favourite_with_type_mail, set_favourite_with_type_mail ] = useState([]);
	const [ favourite_with_type_group, set_favourite_with_type_group ] = useState([]);
	const [ favourite_with_type_images, set_favourite_with_type_images ] = useState([]);
	const [ favourite_with_type_group_content, set_favourite_with_type_group_content ] = useState([]);


	const [open_img_in_message, set_open_img_in_message] = useState(null);
	const [roller_path, set_roller_path] = useState('');
	const [roller_index, set_roller_index] = useState(null);

	useEffect(()=>{
		if( my_id ){
			console.log('_____ my_id = ', my_id?.my_id);
		}
	},[my_id])

	async function get_favourites(){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('http://localhost:8080/get_favourites', {}, {
				headers: {
					Authorization: `Bearer ${token}`,
				}
			});
			if( response?.data?.message ){
				console.log('Сервер вернул сообщение: ', response?.data?.message);
			};
			if( response?.data?.refresh ){
				// обновление
			};
			if( response?.data?.favourites ){
				// избранные
				set_favourites(response?.data?.favourites);
			}
		}
		catch(err){
			return console.error('Ошибка: ', err);
		}
	};

	useEffect(()=>{
		console.log('______favourites = ', favourites);
		set_favourite_with_type_user_page([]);
		set_favourite_with_type_mail([]);
		set_favourite_with_type_group([]);
		set_favourite_with_type_images([]);
		set_favourite_with_type_group_content([])
		if( favourites.length > 0 ){
			favourites.forEach(favourite => {
				if( favourite?.type === 'user_page' ){
					set_favourite_with_type_user_page(favourite_with_type_user_page => [...favourite_with_type_user_page, favourite]);
				};
				if( favourite?.type === 'mail' ){
					set_favourite_with_type_mail(favourite_with_type_mail => [...favourite_with_type_mail, favourite]);
				};
				if( favourite?.type === 'group' ){
					set_favourite_with_type_group(favourite_with_type_group => [...favourite_with_type_group, favourite]);
				};
				if( favourite?.type === 'image' ){
					set_favourite_with_type_images(favourite_with_type_images => [...favourite_with_type_images, favourite]);
				};
				if( favourite?.type === 'group_content' ){
					set_favourite_with_type_group_content(favourite_with_type_group_content => [...favourite_with_type_group_content, favourite]);
				};
			});
		}
	},[favourites])

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

	async function clear_favourites(){
		try{
			const response = await axios.post('http://localhost:8080/clear_favourites', {},{})
		}
		catch(err){

		}
	};

	async function clear_favourite(favourite){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('http://localhost:8080/clear_favourite', {
				favourite: favourite,
			}, {
				headers: {
					Authorization: `Bearer ${token}`,
				}
			});
			if( response?.data?.message ){
				console.log('Сервер вернут сообщение: ', response?.data?.message);
			};
			if( response?.data?.refresh ){
				//обновление
				get_favourites();
			};
			if( response?.data?.error ){
				console.error('Сервер вернул ошибку: ', response?.data?.error);
			};
		}
		catch(err){
			return console.error('Ошибка удаления избранного контента: ', err);
		}
	};

	function open_img(img, images, index){
		if( !img ){ return };
		set_open_img_in_message({
			img: img,
			images: images,
			index: index,
		});
	};

	function close_img(){
		set_open_img_in_message(null);
		set_roller_index(null)
	};

	useEffect(()=>{
		get_favourites();
		get_avatars();
		// clear_favourites();
	},[]);

	return (
		<div className='favourites'>
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
							user_id={my_id}
							close={()=>{set_visiable_panel_with_invites(false)}}
							avatars={avatars}
							get_avatars={get_avatars}
						></Invites_Page>
					}
					{open_img_in_message !== null &&
						<View_For_Images
							images={open_img_in_message?.images || null} 
							visible_images={open_img_in_message?.images || null} 
							hidden_images={''} 
							current_img={open_img_in_message?.img}
							current_index_img={open_img_in_message?.index} 
							set_current_img={''} 
							close={()=>{set_open_img_in_message(null)}} 
							type_arhiv={'bottom'} 
							type_view={'favourite'} 
							visible_arhiv={''}
						>
						</View_For_Images>
					}
					<div className='blocks'>
						<div className='block-item'>
							<div className={cl.buttons_row}>
								<div className={type === 'all' ? cl.buttons_row_item_active : cl.buttons_row_item} onClick={()=>{set_type('all')}}> Всё </div>
								<div className={type === 'groups' ? cl.buttons_row_item_active : cl.buttons_row_item} onClick={()=>{set_type('groups')}}> Группы </div>
								<div className={type === 'mails' ? cl.buttons_row_item_active : cl.buttons_row_item} onClick={()=>{set_type('mails')}}> Сообщения </div>
								<div className={type === 'peoples' ? cl.buttons_row_item_active : cl.buttons_row_item} onClick={()=>{set_type('peoples')}}> Люди </div>
								<div className={type === 'images' ? cl.buttons_row_item_active : cl.buttons_row_item} onClick={()=>{set_type('images')}}> Изображения </div>
								<div className={type === 'group_content' ? cl.buttons_row_item_active : cl.buttons_row_item} onClick={()=>{set_type('group_content')}}> Сообщения группы </div>
							</div>
						</div>
					</div>
					<div className='blocks'>
						<div className='block-item no-background-color'>
							<div className={cl.favourites_block}>

								{favourite_with_type_user_page.length > 0 && (type === 'all' || type === 'peoples') &&
									<div className={cl.box}>
										<div className={cl.box_name}>
											Люди
										</div>
										<div className={cl.box_item}>
											{
												favourite_with_type_user_page.map(favourite =>
													<div key={favourite?.content_id} className={cl.favourite_item}>
														<div className={cl.row}>
															<div className={cl.block_data}>
																{favourite?.content_data?.img_path &&
																	<div className={cl.img}>
																		<img src={favourite?.content_data?.img_path} alt="img"/>
																	</div>
																}
																<div className={cl.name}>
																	{favourite?.content_user_name}
																</div>
															</div>
															<div className={cl.clear} onClick={()=>{clear_favourite(favourite)}}>
																удалить
															</div>
														</div>
													</div>
												)
											}
										</div>
									</div>
								}
								{favourite_with_type_mail.length > 0 && (type === 'all' || type === 'mails') &&
									<div className={cl.box}>
										<div className={cl.box_name}>
											Сообщения
										</div>
										<div className={cl.box_item}>
											{
												favourite_with_type_mail.map(favourite =>
													<div key={favourite?.content_id} className={cl.favourite_item}>
														<div className='row padding-10-0'>
															<div className='col-9 t-a-l'>
																<div className={cl.block_data}>
																	{favourite?.content_data?.img_path &&
																		<div className={cl.img}>
																			<img src={favourite?.content_data?.img_path} alt="img"/>
																		</div>
																	}
																	<div className={cl.name}>
																		{favourite?.content_user_name}
																	</div>
																</div>
																<div className={cl.mail_voice}>
																	{favourite?.content_data?.voice &&
																		<audio controls src={`http://localhost:8080/voice/${favourite?.content_data?.voice}`}></audio>
																	}
																</div>
																<div className={cl.mail_text}>
																	{(favourite?.content_data?.text && favourite?.content_data?.text.length > 100)
																	?
																		favourite?.content_data?.text //.slice(0,100) + '...'
																	:
																		favourite?.content_data?.text
																	}
																</div>
																<div className={cl.img_row} 
																	style={{
																		gridTemplateColumns: 
																			favourite?.content_data?.images && JSON.parse(favourite?.content_data?.images).length === 1 
																			? 
																				'minmax(10px, auto)' 
																			: 
																			favourite?.content_data?.images && JSON.parse(favourite?.content_data?.images).length === 2
																			?
																				'repeat(2, minmax(10px, auto))'
																			:
																			favourite?.content_data?.images && JSON.parse(favourite?.content_data?.images).length === 3
																			?
																				'repeat(3, minmax(10px, auto))'
																			:
																			favourite?.content_data?.images && JSON.parse(favourite?.content_data?.images).length === 4
																			?
																				'repeat(2, minmax(10px, auto))'
																			:	
																			favourite?.content_data?.images && JSON.parse(favourite?.content_data?.images).length === 5
																			?
																				'repeat(5, minmax(10px, auto))'
																			:
																			favourite?.content_data?.images && JSON.parse(favourite?.content_data?.images).length === 6
																			&&
																				'repeat(3, minmax(10px, auto))'
																		,
																		aspectRatio:
																		favourite?.content_data?.images && favourite?.content_data?.images.length === 5
																		&&
																			'1.5/0.4'
																	}}
																>
																	{	
																		favourite?.content_data?.images && JSON.parse(favourite?.content_data?.images).map((img, index_img) =>	
																			<img key={img + index_img} className={cl.group_content_img} src={img} alt="картинка" onClick={()=>{open_img(img, JSON.parse(favourite?.content_data?.images), index_img)}}/>
																		)
																	}
																</div>
															</div>
															<div className='col-1'>
																<div className={cl.clear} onClick={()=>{clear_favourite(favourite)}}>
																	удалить
																</div>
															</div>
														</div>
													</div>
												)
											}
										</div>
									</div>
								}
								{favourite_with_type_group.length > 0 && (type === 'all' || type === 'groups') &&
									<div className={cl.box}>
										<div className={cl.box_name}>
											Группы
										</div>
										<div className={cl.box_item}>
											{
												favourite_with_type_group.map(favourite =>
													<div key={favourite?.content_id} className={cl.favourite_item}>
														<div className='row padding-10-0'>
															<div className='col-9 t-a-l'>
																<div className={cl.block_data}>
																	{favourite?.content_data?.img_path &&
																		<div className={cl.img}>
																			<img src={favourite?.content_data?.img_path} alt="img"/>
																		</div>
																	}
																	<div className={cl.name}>
																		{favourite?.content_data?.name}
																	</div>
																</div>
															</div>
															<div className='col-1'>
																<div className={cl.clear} onClick={()=>{clear_favourite(favourite)}}>
																	удалить
																</div>
															</div>
														</div>
													</div>
												)
											}
										</div>
									</div>
								}
								{favourite_with_type_group_content.length > 0 && (type === 'all' || type === 'group_content') &&
									<div className={cl.box}>
										<div className={cl.box_name}>
											Сообщения группы
										</div>
										<div className={cl.box_item}>
											{
												favourite_with_type_group_content.map(favourite =>
													<div key={favourite?.content_id} className={cl.favourite_item}>
														<div className='row padding-10-0'>
															<div className='col-9 t-a-l'>
																<div className={cl.block_data}>
																	{favourite?.content_data?.img_path &&
																		<div className={cl.img}>
																			<img src={favourite?.content_data?.img_path} alt="img"/>
																		</div>
																	}
																	<div className={cl.name}>
																		{favourite?.content_user_name}
																	</div>
																</div>
																<div className={cl.mail_text}>
																	{(favourite?.content_data?.text && favourite?.content_data?.text.length > 100)
																	?
																		favourite?.content_data?.text.slice(0,100) + '...'
																	:
																		favourite?.content_data?.text
																	}
																</div>
																<div className={cl.images}>
																	{favourite?.content_data?.images && favourite?.content_data?.images.length > 0
																	?	
																		<div className={cl.forma}>
																			<div className={cl.img_container}>
																				{favourite?.content_data?.images.length > 0 &&
																					<div className={favourite?.content_data?.images.length === 1 ? cl.cell_one : cl.img_block}>
																						<div className={cl.img_row} 
																							style={{
																								gridTemplateColumns: 
																									JSON.parse(favourite?.content_data?.images).length === 1 
																									? 
																										'minmax(10px, auto)' 
																									: 
																									JSON.parse(favourite?.content_data?.images).length === 2
																									?
																										'repeat(2, minmax(10px, auto))'
																									:
																									JSON.parse(favourite?.content_data?.images).length === 3
																									?
																										'repeat(3, minmax(10px, auto))'
																									:
																									JSON.parse(favourite?.content_data?.images).length === 4
																									?
																										'repeat(2, minmax(10px, auto))'
																									:	
																									JSON.parse(favourite?.content_data?.images).length === 5
																									?
																										'repeat(5, minmax(10px, auto))'
																									:
																									JSON.parse(favourite?.content_data?.images).length === 6
																									&&
																										'repeat(3, minmax(10px, auto))'
																								,
																								aspectRatio:
																								JSON.parse(favourite?.content_data?.images).length === 5
																								&&
																									'1.5/0.4'
																							}}
																						>
																							{	
																								JSON.parse(favourite?.content_data?.images).map((img, index_img) =>	
																									<img key={img + index_img} className={cl.group_content_img} src={img} alt="картинка" onClick={()=>{open_img(img, JSON.parse(favourite?.content_data?.images), index_img)}}/>
																								)
																							}
																						</div>
																					</div>
																				}
																			</div>
																		</div>									
																	: null}
																</div>
															</div>
															<div className='col-1'>
																<div className={cl.clear} onClick={()=>{clear_favourite(favourite)}}>
																	удалить
																</div>
															</div>
														</div>
													</div>
												)
											}
										</div>
									</div>
								}
								{favourite_with_type_images.length > 0 && (type === 'all' || type === 'images') &&
									<div className={cl.box}>
										<div className={cl.box_name}>
											Изображения
										</div>
										<div className={cl.box_item}>
											{
												favourite_with_type_images.map(favourite =>
													<div key={favourite?.content_id} className={cl.favourite_item}>
														<div className='row padding-10-0'>
															<div className='col-9 t-a-l'>
																<img 
																	className={cl.img_into_message} 
																	src={favourite?.content_data?.img_path} // item.path
																	lazy='true'
																	lazy_src={favourite?.content_data?.img_path}
																	alt="Фотография"
																	onClick={()=>{open_img(favourite?.content_data?.img_path, null, null)}}
														    	/>	
															</div>
															<div className='col-1'>
																<div className={cl.clear} onClick={()=>{clear_favourite(favourite)}}>
																	удалить
																</div>
															</div>
														</div>
													</div>
												)
											}
										</div>
									</div>
								}
								{/* если пусто (костыль) */}
								{favourite_with_type_user_page.length === 0 && type === 'all' && favourite_with_type_mail.length === 0 && favourite_with_type_group.length === 0 && favourite_with_type_images.length === 0 && favourite_with_type_group_content.length === 0 &&
									'пусто'
								}
								{favourite_with_type_user_page.length === 0 && type === 'peoples' &&
									'пусто'
								}
								{favourite_with_type_mail.length === 0 && type === 'mails' &&
									'пусто'
								}
								{favourite_with_type_group.length === 0 && type === 'groups' &&
									'пусто'
								}
								{favourite_with_type_images.length === 0 && type === 'images' &&
									'пусто'
								}
								{favourite_with_type_group_content.length === 0 && type === 'group_content' &&
									'пусто'
								}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		)
}

export default Favourites;