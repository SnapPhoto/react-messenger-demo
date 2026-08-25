import React, {useState, useEffect, useRef} from 'react';
import cl from './group_settings_panel.module.css';

export const Group_Settings_Panel = ({remove_group, group_data, get_group_data, del, set_del, role, cancel_del, set_visiable_panel_load_file, set_visiable_panel_load_header_file, is_join, set_visiable_panel_titles, this_my_group, posts, posts_images, set_visiable_panel_with_hidden_post, set_visiable_panel_with_push_user_in_group, visiable_panel_with_invites, set_visiable_panel_with_invites, set_visiable_panel_add_password, set_visiable_panel_change_password, send_bad_request_for_group, this_group_id, my_id, remove_bad_request_for_group, add_favourites, ws_message_type, ws_ref}) => {
	const [remove, set_remove] = useState(false);
	const group_id = group_data?._id;
	const header_big_img = document.querySelector('.current-group-big-img');
	const [header_big_img_size, set_header_big_img_size] = useState(null);
	const [ sended_bad_request, set_sended_bad_request ] = useState(false);

	useEffect(()=>{
		if( group_data !== null && my_id && group_id ){
			const bad_request = false;
			if( group_data?.group_bad_requests.length === 0 ){
				set_sended_bad_request(false)
			}
			group_data?.group_bad_requests.forEach((request) => {
				console.log('request = ', request);
				if( request?.user_id === my_id ){
					set_sended_bad_request(true)
				}
				else {
					set_sended_bad_request(false)
				}
			})
		}
	},[group_data, group_id, my_id])

	useEffect(()=>{
		if( header_big_img ){
			const header_size = header_big_img.getBoundingClientRect();
			if( header_size ){
				set_header_big_img_size(header_size);
				console.log('h = ', header_size?.height)
			}
		};
	},[header_big_img])

	useEffect(()=>{
		if( remove === true ){
			set_del(true);
		}
	},[remove]);

	useEffect(()=>{
		if( cancel_del === false ){
			set_remove(false)
		}
	},[cancel_del])

	useEffect(()=>{
		if( group_data ){
			console.log('_____] group_data = ', group_data)
		}
	},[group_data])

	return (
		<div className={cl.panel} style={{top: header_big_img_size?.height || 0}}>
			{(role === 'main_admin' || this_my_group) && is_join &&
				<div className={cl.button} onClick={()=>{set_visiable_panel_load_file(true)}}>
					изменить аватарку группы
				</div>
			}
			{(role === 'main_admin' || this_my_group) && is_join &&
				<div className={cl.button} onClick={()=>{set_visiable_panel_load_header_file(true)}}>
					изменить шапку группы
				</div>
			}
			{(role === 'main_admin' || this_my_group) && is_join &&
				<div className={cl.button} onClick={()=>{set_visiable_panel_titles(true)}}>
					изменить описание группы
				</div>
			}
			{(role === 'main_admin' || this_my_group) && is_join && group_data?.group_settings?.password === '' 
			?
				<div className={cl.button} onClick={()=>{set_visiable_panel_add_password(true)}}>
					установить пароль
				</div>
			:
			(role === 'main_admin' || this_my_group) && is_join && group_data?.group_settings?.password !== '' &&
				<div className={cl.button} onClick={()=>{set_visiable_panel_change_password(true)}}>
					изменить пароль
				</div>
			}
			<div className='split-maxima'>
				{/* разделитель */}
			</div>
			{(role === 'main_admin' || this_my_group) && is_join &&
				<div className={cl.button} onClick={()=>{set_visiable_panel_with_hidden_post(true)}}>
					скрытые посты
				</div>
			}
			<div className='split-maxima'>
				{/* разделитель */}
			</div>
			{is_join &&
				<div className={cl.button} onClick={()=>{set_visiable_panel_with_invites(false); set_visiable_panel_with_push_user_in_group(true)}}>
					пригласить в группу
				</div>
			}
			<div className='split-maxima'>
				{/* разделитель */}
			</div>
			<div className={cl.button} onClick={()=>{add_favourites('group')}}>
					добавить в избранное
				</div>
			<div className='split-maxima'>
				{/* разделитель */}
			</div>
			{role !== 'main_admin' && is_join && !this_my_group && my_id && !sended_bad_request
			?
				<div className={cl.button} onClick={()=>{send_bad_request_for_group(); get_group_data()}}>
					пожаловаться
				</div>
			:
				!this_my_group &&
				<div className={cl.button} onClick={()=>{remove_bad_request_for_group(); get_group_data()}}>
					отменить жалобу
				</div>
			}
			{/* {role !== 'main_admin' && */}
			{/* 	<div className={cl.button} onClick={()=>{}}> */}
			{/* 		выйти */}
			{/* 	</div> */}
			{/* } */}
			<div className='split-maxima'>
				{/* разделитель */}
			</div>
			{role === 'main_admin' && is_join &&
				<div className={cl.delete} onClick={()=>{set_remove(true)}}>
					удалить группу
				</div>
			}
			{/* {!is_join && */}
			{/* 	'Сперва вступите в группу' */}
			{/* } */}
		</div>
	)
};

export default Group_Settings_Panel;