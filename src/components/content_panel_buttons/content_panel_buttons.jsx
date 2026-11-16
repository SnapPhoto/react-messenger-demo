import React, {useState, useEffect, useRef} from 'react';
import $ from 'jquery';
import cl from './content_panel_buttons.module.css';

export const Content_Panel_Buttons = ({options, visiable, close, this_remove, this_change, this_hide, hidden, this_my_page, add_to_favourite, for_current_mails, group_id, mail_id, this_my_message, this_user_page, this_group, ws_message_type, ws_ref}) => {

	// user_page - показатель, что это страница; [true/false]
	// for_current_mails - показатель активности current_mails

	function this_close(){
		close(false);
	};

	const form = useRef(null);
	useEffect(()=>{
		if( form.current !== null ){
			$(form.current).on('mouseleave', {}, this_close);
		}
		return ()=>{
			if( form.current !== null ){
				$(form.current).off();
			}
		}
	},[form])
	return (
		<div ref={form} className={!this_my_page && this_user_page ? cl.form_deactive : cl.form}>
			{((this_user_page && this_my_page) || ((hidden === 'false' || hidden === false || hidden === null || hidden === undefined) && this_my_page && !this_user_page) || (for_current_mails && this_my_message)) &&
				<div className={cl.option} onClick={()=>{this_change(); close()}}>
					изменить
				</div>
			}
			{(hidden === 'false' || hidden === false || hidden === null || hidden === undefined) && !this_user_page &&
				<div className={cl.option} onClick={()=>{add_to_favourite(group_id ? 'group_content' : mail_id ? 'mail' : 'error'); close()}}>
					добавить в избранное
				</div>
			}
			{(this_my_page || ((this_group || this_user_page) && (hidden === 'true' || hidden === true))) &&
				<div className={cl.option} onClick={()=>{this_hide(); close(false)}}>
					{hidden === 'true' || hidden === true
					?
						'вернуть'
					:
						'скрыть'
					}
				</div>
			}
			{this_my_page &&
				<div className={cl.option_remove} onClick={()=>{this_remove()}}>
					удалить
				</div>
			}
		</div>
	)
};

export default Content_Panel_Buttons;