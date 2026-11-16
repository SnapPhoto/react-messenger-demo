import React, { useState, useEffect } from 'react';
import cl from './panel_with_add_password.module.css';
import Button_Default from '../buttons/button_default/button_default.jsx';
import axios from 'axios';

export const Panel_With_Add_Password = ({close, group_id, this_my_group, refresh}) => {

	const [ password_text, set_password_text ] = useState('');

	useEffect(()=>{
 		if( !this_my_group ){
 			close();
 		}
	},[this_my_group])

	async function set_password(){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		}
		try{
			const response = await axios.post('/set_password_for_group', {
				group_id: group_id,
				this_my_group: this_my_group,
				password: password_text,
			}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			})
			if( response?.data?.message ){
				console.log('Ответ от сервера: ', response?.data?.message );
			};
			if( response?.data?.refresh ){
				refresh();
			}
		}
		catch(err){
			console.error('Ошибка установки пароля для группы: ', err);
		}
	}

	return (
		<div className={cl.panel_with_add_password}>
			<div className={cl.fon} onClick={()=>{close()}}>
				{/* фон */}
			</div>
			<div className={cl.panel} onClick={(e)=>{e.stopPropagation()}}>
				{/* панель */}
				<div className={cl.text}>
					Создание пароля
				</div>
				<div className={cl.box}>
					<input className={cl.input} type="text" value={password_text} onChange={(e)=>set_password_text(e.target.value)} placeholder={'придумайте_ваш_пароль'}/>
				</div>
				<div className={cl.buttons}>
					<Button_Default
						onClick={()=>{set_password()}}
					>Установить
					</Button_Default>
					<div className={cl.button_close} onClick={()=>{close()}}>
						Закрыть
					</div>
				</div>
			</div>
		</div>
	)
}

export default Panel_With_Add_Password;