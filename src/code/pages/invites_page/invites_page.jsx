import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';
import cl from './invites_page.module.css';
import $ from 'jquery';
import Searcher from '../../../components/searcher/search.jsx';

export const Invites_Page = ({close, get_avatars}) => {

	const [ avatars, set_avatars ] = useState([]);
	const [ groups_profils_avatars, set_groups_profils_avatars ] = useState([]);
	const navigate = useNavigate();
	const token = localStorage.getItem('token');
	const [ invites, set_invites ] = useState([]); // приглашения
	const [ default_invites, set_default_invites] = useState([]);
	const [ visiable_user_avatar, set_visiable_user_avatar ] = useState(null);
	const [ visiable_group_avatar, set_visiable_group_avatar ] = useState(null);

	async function get_groups_profils(){
		console.log('ВЫПОЛНЕНИЕ GET_GROUPS_PROFILS()')
		try{
			let profils = [];
			const files = (context) => context.keys().map(context);
			const imgs = files(require.context('../../../../src/images/groups_profils/', false, /\.(jpg)$/));
			if( imgs.length > 0 ){
				imgs.map((o,i) => {
					const raw_name = o.split('/')[3].split('.');
					const name = raw_name[0] + '.' + raw_name[2];
					const o_data = {
						path: o,
						name: name,
					};
					profils.push(o_data);
				})
			};
			if( profils.length > 0 ){
				set_groups_profils_avatars(profils)
			}
		}
		catch(err){
			console.error('Ошибка получения изображений групп: ', err)
		};
	};

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

	async function get_invites(){
		const token = localStorage.getItem('token');
		if( !token ){
			return console.error('Токен не существует');
		};
		try{
			set_invites([]);
			set_default_invites([]);
			const response = await axios.post('http://localhost:8080/get_invites_for_me', {

			}, {
				headers: {
					Authorization: `Bearer ${token}`,
				}
			});
			console.log(response);
			if( response?.data?.invites ){
				if( response?.data?.invites.length > 0 ){
					set_invites(response?.data?.invites);
					set_default_invites(response?.data?.invites);
				}
				else {
					set_invites([]);
					set_default_invites([])
				}

			}
		}
		catch(err){
			console.error('Ошибка: ',err);
		}
	};

	async function join_group(id){
		await navigate(`/main/current_group/${id}/page`);
	};

	useEffect(()=>{
		if( token ){
			get_invites();
			get_avatars();
			get_groups_profils();
		}
	},[token]);

	function mouse_enter(item){
		// console.log('enter!')
		item.style.width = '100%';
	};

	function mouse_leave(item){
		// console.log('leave!')
		item.style.width = '5%';
	};

	useEffect(()=>{
		if( invites ){
			const buttons = document.querySelectorAll(`.${cl.button_close}`);
			if( buttons.length > 0 ){
				buttons.forEach(button => {
					button.addEventListener('mouseenter', ()=>{mouse_enter(button)});
					button.addEventListener('mouseleave', ()=>{mouse_leave(button)});
				})
			}
		}
		return ()=>{
			const buttons = document.querySelectorAll(`.${cl.button_close}`);
			if( buttons.length > 0 ){
				buttons.forEach(button => {
					console.log('Очистка')
					button.removeEventListener('mouseenter', ()=>{mouse_enter(button)});
					button.removeEventListener('mouseleave', ()=>{mouse_leave(button)});
				})
			}
		}
	},[invites]);

	async function delete_invite(invite){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('http://localhost:8080/remove_invite', {
				invite: JSON.stringify(invite),
			}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.refresh ){
				console.log('response?.data?.refresh = ',response?.data?.refresh)
				get_invites();
			}
		}
		catch(err){
			return console.error('Ошибка удаления: ', err);
		}
	}

	async function add_invite_id_for_user(invite){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			console.log('----------------------- invite = ', invite);
			const response = await axios.post('http://localhost:8080/add_invite_id_for_user', {
				id_from: invite?.id_from,
				id_for: invite?.id_for,
				group_id: invite?.invite_data?.id,
			}, {
				headers: {
					Authorization: `Bearer ${token}`,
				}
			});
			if( response?.data?.message ){
				console.log('Ответ от сервера: ', response?.data?.message);
			};
			if( response?.data?.refresh ){
				//обновление
			};
			if( response?.data?.error ){
				console.error('Сервер вернул ошибку: ', response?.data?.error);
			};
		}
		catch(err){
			return console.error('Ошибка: ', err);
		}
	};

	return (
		<div className={cl.invites_page}>
			<div className={cl.row}>
				<div className={cl.button} onClick={()=>{close()}}>
					Закрыть
				</div>
			</div>
			<Searcher
				value={invites}
				set_value={set_invites}
				default_value={default_invites}
			></Searcher>
			<div className='split-maxima'></div>
			<div className={cl.panel}>
				{token
				?
					invites.length > 0
					?												
						invites.map((invite, index) => 
							<div key={index} className={cl.invite_block}>
								<div className={cl.data}>
									<div className={cl.box_user} onMouseEnter={()=>{set_visiable_user_avatar({invite: invite, index: index})}} onMouseLeave={()=>{set_visiable_user_avatar(null)}} onClick={()=>{close(); navigate(`/main/${invite ? invite?.id_from : 'user_undefined'}/page`)}}>
										{invite?.invite_data?.avatar_from &&
											<img className={cl.img_user} src={avatars.find(avatar => avatar?.name === invite?.invite_data?.avatar_from)?.path} alt="аватарка"/>
										}
										<div className={cl.name}>
											{invite?.invite_data?.name_from.length < 20 ? invite?.invite_data?.name_from : invite?.invite_data?.name_from.slice(0,20) + '...'}
										</div>
									</div>
									<div className={cl.line}>
										приглашает Вас вступить в группу
									</div>
									<div className={cl.box_group} onMouseEnter={()=>{set_visiable_group_avatar({invite: invite, index: index})}} onMouseLeave={()=>{set_visiable_group_avatar(null)}} onClick={()=>{close(); add_invite_id_for_user(invite); join_group(invite?.invite_data?.id); delete_invite(invite)}}>
										{invite?.invite_data?.group_img &&
											<img className={cl.img_group} src={groups_profils_avatars.find(avatar => avatar?.name === invite?.invite_data?.group_img)?.path} alt="аватарка"/>
										}
										<div className={cl.name}>
											{invite?.invite_data?.group_name.length < 20 ? invite?.invite_data?.group_name : invite?.invite_data?.group_name.slice(0,20) + '...'}
										</div>
									</div>
								</div>
								<div className={cl.button_close} onClick={()=>{delete_invite(invite)}}>
									Удалить
								</div>
							</div>
						)
					:
						<div className={cl.not_found}>
							приглашения не найдены
						</div>
				:
					<div>
						Ошибка id
					</div>
				}
			</div>
		</div>
	)
};

export default Invites_Page;