import React, { useState, useEffect } from 'react';
import cl from './panel_with_change_password.module.css';
import Button_Default from '../buttons/button_default/button_default.jsx';
import axios from 'axios';

export const Panel_With_Add_Password = ({close, group_id, group_data, this_my_group, refresh}) => {

	const [ new_password_text, set_new_password_text ] = useState('');
	const [ old_password_text, set_old_password_text ] = useState('');

	useEffect(()=>{
 		if( !this_my_group ){
 			close();
 		}
	},[this_my_group])

	async function change_password(){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		}
		try{
			const response = await axios.post('/change_password_for_group', {
				group_id: group_id,
				old_password: old_password_text,
				new_password: new_password_text,
				this_my_group: this_my_group,
			}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			})
			if( response?.data?.message ){
				console.log('Ответ от сервера: ', response?.data?.message);
			}
			if( response?.data?.refresh ){
				refresh();
			}
		}
		catch(err){
			console.error('Ошибка установки пароля для группы: ', err);
		}
	}

	async function remove_password(){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		}
		try{
			const response = await axios.post('/remove_password_for_group', {
				group_id: group_id,
				this_my_group: this_my_group,
			}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			})
			if( response?.data?.message ){
				console.log('Ответ от сервера: ', response?.data?.message);
			}
			if( response?.data?.refresh ){
				refresh();
			}
		}
		catch(err){
			console.error('Ошибка установки пароля для группы: ', err);
		}
	}

	return (
		<div className={cl.panel_with_change_password}>
			<div className={cl.fon} onClick={()=>{close()}}>
				{/* фон */}
			</div>
			<div className={cl.panel} onClick={(e)=>{e.stopPropagation()}}>
				{/* панель */}
				<div className={cl.text}>
					Изменение пароля
				</div>
				{this_my_group
				?
					<div className={cl.box}>
						СТАРЫЙ ПАРОЛЬ: {group_data?.group_settings?.password}
					</div>
				:
					<div className={cl.box}>
						<input className={cl.input} type="text" value={old_password_text} onChange={(e)=>set_old_password_text(e.target.value)} placeholder={'введите старый пароль'}/>
					</div>
				}
				<div className={cl.box}>
					<input className={cl.input} type="text" value={new_password_text} onChange={(e)=>set_new_password_text(e.target.value)} placeholder={'придумайте_ваш_новый_пароль'}/>
				</div>
				<div className={cl.buttons}>
					<Button_Default
						onClick={()=>{change_password()}}
					>Применить изменения
					</Button_Default>
					<Button_Default
						onClick={()=>{remove_password()}}
						style={{backgroundColor: 'rgba(230,50,50,1)', cursor: 'pointer'}}
					>Удалить пароль
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