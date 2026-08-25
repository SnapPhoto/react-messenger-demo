import React, {useState, useEffect, useRef} from 'react';
import '../../App.css';
import Button_Default from '../../components/buttons/button_default/button_default';
import {Link} from 'react-router-dom';
import axios from 'axios';


export const account_panel = ({account_panel_active, set_account_panel_active, my_data, avatar, set_selected_avatar, select_file, refresh_user_data}) => {
	function select_avatar(){
		document.querySelector('.select_avatar').value = '';
		document.querySelector('.select_avatar').click();
	};

	async function remove_avatar(){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('http://localhost:8080/remove_account_profil_avatar', {}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.refresh ){
				refresh_user_data();
			}
		}
		catch(err){
			return console.error('Ошибка: ', err);
		}
	}

	function clear_localStorage(){
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
	};



	return (
		<div className='account-panel'>	
			<div className='close-account-panel' style={{display: `${account_panel_active ? 'block' : 'none'}`}}>
				<Button_Default onClick={()=>{set_account_panel_active(false)}}>x</Button_Default>
			</div>
			<div className="account-panel-top">
				<div className='account-img-cell'>
				<form className='form_select' action="">
					<input className='select_avatar' type="file" style={{display: 'none'}} onChange={(e)=>{select_file(e.target.files[0])}} accept='image/jpeg'/>
				</form>
				{my_data.profil_avatar && avatar
				?
					<div>
						<img className='account-img' src={avatar} alt='Аватарка'/>
						<div className="reload_profil_avatar">
							{my_data.profil_avatar.includes('_-_empty')
							?
								<Button_Default onClick={()=>{select_avatar()}}>
									Установить
								</Button_Default>
							:
								<Button_Default onClick={()=>{select_avatar()}}>
									Заменить
								</Button_Default>
							}
							{!my_data.profil_avatar.includes('_-_empty') &&
								<Button_Default onClick={()=>{remove_avatar()}}>
									Удалить
								</Button_Default>
							}
						</div>
					</div>
				:
					<div className='load_profil_avatar'>
						<img className='account-img' alt="Загрузить фото" onClick={select_avatar}/>
					</div>
				}
				</div>
			</div>
			<div className='account-panel-middle'>
				<div className='col-2'>
					имя
				</div>
				<div className='col-8'>
					{my_data ? my_data.name : 'Имя не указано'}
				</div>
				<div className='split'>
					{/* разделитель */}
				</div>
				<div className='col-2'>
					email
				</div>
				<div className='col-8'>
					{my_data ? my_data.email : 'Email не указан'}
				</div>
				<div className='split'>
					{/* разделитель */}
				</div>
				<div className='col-2'>
					дата
				</div>
				<div className='col-8'>
					{my_data ? `${my_data.date?.year}.${my_data.date?.month}.${my_data.date?.day}` : 'Дата не указана'}
				</div>
				<div className='split'>
					{/* разделитель */}
				</div>
				<div className='col-2'>
					img
				</div>
				<div className='col-8'>
					{my_data ? my_data.profil_avatar ? my_data.profil_avatar : 'error' : 'Аватарка профиля не загружена'}
				</div>
				<div className='split'>
					{/* разделитель */}
				</div>
				<div className='col-2'>
					
				</div>
				<div className='col-8'>
					
				</div>
				<div className='split'>
					{/* разделитель */}
				</div>
				<div className='col-2'>
					
				</div>
				<div className='col-8'>
					
				</div>
				<div className='split'>
					{/* разделитель */}
				</div>
				<div className='col-2'>
					
				</div>
				<div className='col-8'>
					
				</div>
				<div className='split'>
					{/* разделитель */}
				</div>
				<div className='col-2'>
					
				</div>
				<div className='col-8'>
					
				</div>
				<div className='split'>
					{/* разделитель */}
				</div>
				<div className='col-2'>
					
				</div>
				<div className='col-8'>
					
				</div>
				<div className='split'>
					{/* разделитель */}
				</div>
				<div className='col-2'>
					
				</div>
				<div className='col-8'>
					
				</div>
				<div className='split'>
					{/* разделитель */}
				</div>
				<div className='col-10'>
					<Link className='link' to='/account/settings'>Настройки</Link>
				</div>
				<div className='split'>
					{/* разделитель */}
				</div>
				<div className='col-10'>
					<Link className='link' onClick={()=>{clear_localStorage()}} to='/account/logout'>Выйти</Link>
				</div>
			</div>
			<div className='account-panel-bottom'>
				{/* низ */}
			</div>
		</div>
	)
};

export default account_panel;