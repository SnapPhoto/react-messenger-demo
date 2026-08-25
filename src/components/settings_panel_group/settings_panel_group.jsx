import React, {useState, useEffect} from 'react';
import cl from './settings_panel_group.module.css';

export const Settings_Panel_Group = ({this_my_group ,group_id, user, posts, close_panel, set_visiable_panel_with_hidden_post}) => {

	useEffect(()=>{
		if( !this_my_group || !group_id || !user ){
			console.warn('Данные неполные');
		};
	},[user, group_id, this_my_group])

	return (
		<div className={cl.settings_panel_group} onMouseLeave={()=>{close_panel()}}>
			<div className={cl.close_button} onClick={()=>{close_panel()}}>
				закрыть
			</div>
			{posts !== null && posts !== undefined && posts.length > 0 &&
				posts.filter(p=>p.hide === 'true').length > 0 &&
					<div className={cl.settings_panel_group_button} onClick={()=>{set_visiable_panel_with_hidden_post(true)}}>
						скрытые посты
					</div>
			}
		</div>
	)
};

export default Settings_Panel_Group;