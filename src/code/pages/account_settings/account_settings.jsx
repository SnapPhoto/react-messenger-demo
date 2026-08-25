import React, {useState, useEffect, useRef} from 'react';
import cl from './account_settings.module.css';
import Button_Default from '../../../components/buttons/button_default/button_default.jsx';
import axios from 'axios';

export const account_settings = ({my_id, jump_to_login_page}) => {
	async function delete_account(){
		if( !my_id ){
			return console.log('my_id пустой');
		};
		try{
			const token = localStorage.getItem('token');
			if( !token ){
				return console.error('Ошибка токена');
			};
			const response = await axios.post('http://localhost:8080/account/delete', {
				my_id: my_id,
			}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.account_is_deleted ){
				console.log('Аккаунт удалён!!!!')
				if( localStorage.getItem('my_groups_list')){
					localStorage.removeItem('my_groups_list');
				};
				if( localStorage.getItem('groups_list')){
					localStorage.removeItem('groups_list');
				};
				if( localStorage.getItem('mail_data')){
					localStorage.removeItem('mail_data');
				};
				if( localStorage.getItem('token') ){
					localStorage.removeItem('token')
				}
				jump_to_login_page();
			}
		}
		catch(err){
			console.error('Ошибка удаления аккаунта: ', err);
		}
	};

	return (
		<div className={cl.account_settings}>
			<div className={cl.account_settings_form}>
				<div className={cl.account_settings_block}>
					<div className={cl.account_settings_big_text}>
						Настройки аккаунта
					</div>
				</div>
				<div className={cl.account_settings_block}>
					<span className={cl.account_settings_text}>{my_id && `my_id = ${my_id}` || 'my_id === false'}</span>
				</div>
				<div className={cl.account_settings_block}>
					<Button_Default
						type="button"
						onClick={()=>{delete_account()}}
					>
						Удалить аккаунт
					</Button_Default>
				</div>
			</div>
		</div>
	)
};	

export default account_settings;