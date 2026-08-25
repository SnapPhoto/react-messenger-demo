import React, {useState, useEffect} from 'react';
import cl from './settings_panel_user_page.module.css';

export const Settings_Panel_User_Page = ({this_my_page ,user_page_id, user, posts, close_panel, set_visiable_panel_with_hidden_post}) => {

	useEffect(()=>{
		if( !this_my_page || !user_page_id || !user ){
			console.warn('Данные неполные');
		};
	},[user, user_page_id, this_my_page])

	return (
		<div className={cl.settings_panel_user_page} onMouseLeave={()=>{close_panel()}}>
			<div className={cl.close_button} onClick={()=>{close_panel()}}>
				закрыть
			</div>
			{posts !== null && posts !== undefined && posts.length > 0 &&
				posts.filter(p=>p.hide === 'true').length > 0 &&
					<div className={cl.settings_panel_user_page_button} onClick={()=>{set_visiable_panel_with_hidden_post(true)}}>
						скрытые посты
					</div>
			}
		</div>
	)
};

export default Settings_Panel_User_Page;