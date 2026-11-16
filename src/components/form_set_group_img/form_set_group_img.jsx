import React, {useState, useEffect} from 'react';
import cl from './form_set_group_img.module.css';
import Button_Default from '../../components/buttons/button_default/button_default.jsx';
import Loader from '../../components/loader/loader.jsx';
import axios from 'axios';

export const Form = ({set_file, pick_file, set_visiable, set_avatar, loading, old_avatar, group_id, refresh_group_data}) => {

	const [preview, set_preview] = useState(null);
	const [avatars, set_avatars] = useState([]);
	const [pick, set_pick] = useState(false);
	const [update_get_avatars, set_update_get_avatars] = useState(true);

	function get_avatars(){ 
		if( !update_get_avatars ){
			return;
		}
		set_avatars([]);
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			let files = (context) => context.keys().map(context);
			const imgs = files(require.context('../../images/groups_profils/'), false, /\.(jpg)$/);
			if( imgs.length > 0 ){
				let imgs_data = [];
				imgs.map((img)=>{
					const path = img;
					const raw_name = path.split('/')[3].split('.');
					const name = raw_name[0] + '.' + raw_name[2];
					const img_data = {
						path: path,
						name: name,
					};
					imgs_data.push(img_data);
				});
				if( imgs_data.length > 0 ){
					// console.log('шапки = ', imgs_data )
					set_avatars(imgs_data);
					set_pick(false);
					set_update_get_avatars(false);
				};
			};
			files = null;
		}
		catch(err){
			set_avatars([])
			set_pick(false);
			return console.error('Ошибка: ', err);
		}
	};

	useEffect(()=>{
		if( old_avatar ){
			set_update_get_avatars(true);
			get_avatars();
		}
	},[old_avatar])

	useEffect(()=>{
		if( avatars.length > 0 ){
			avatars?.forEach(profil_avatar_data => {
				console.log( 'profil_avatar_data = ', profil_avatar_data);
				console.log('old_avatar = ', old_avatar)
				if( profil_avatar_data?.name === old_avatar ){
					console.log('profil_avatar_data?.path')
					set_preview(profil_avatar_data?.path)
					set_avatars([]);
				}
			})
		}
	},[avatars])

	useEffect(()=>{
		set_preview(null)
		if( pick_file !== null && pick_file.length > 0 ){
			console.log('file = ', pick_file[0])
			set_visiable(true);
			const img_preview = URL.createObjectURL(pick_file[0]);
			if( img_preview ){
				set_preview(img_preview);
				set_pick(true);
			}
		}
	},[pick_file]);

	async function remove_group_avatar(){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('/remove_group_avatar', {
				group_id: group_id,
			}, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			if( response?.data?.refresh ){
				refresh_group_data();
				set_preview(null);
				set_pick(false);
				set_avatars([]);
				set_update_get_avatars(true);
				set_visiable(false)
			}
		}
		catch(err){
			console.log('Ошибка: ', err);
		}
	};

	function open_select(){
		const input_file = document.querySelector('.input_file');
		if( !input_file ){
			return;
		};
		input_file.click();
	};

	function close_panel(){
		const input_file = document.querySelector('.input_file');
		if( pick_file ){
			if( !input_file ){
				return;
			};
			input_file.value = '';
			set_visiable(false)
		}
		else {
			input_file.value = '';
			set_visiable(false)
		}
	};

	function rechange(){
		// set_file(null);
		const input_file = document.querySelector('.input_file');
		if( !input_file ){
			return;
		};
		// input_file.value = '';
		open_select();
	};

	return (
		<div className='panel_set_group_img' onClick={()=>{close_panel()}}>
			<div className='panel_set_group_img_mini_panel' onClick={(e)=>{e.stopPropagation()}}>
				<form className={cl.form} onSubmit={(e)=>{e.preventDefault()}}>
					<input className='input_file' type="file" accept=".jpg" onChange={(e)=>{set_file(e.target.files)}}/>
				</form>
				<div className={cl.preview}>
					{preview !== null 
						?
							<div className={cl.preview_box}>
								{loading &&
									<div className={cl.loader}>
										<div className={cl.loader_item}>
											<div>
												<Loader></Loader>
											</div>
											<div>
												Загружается...
											</div>
										</div>
									</div>
								}
								<img className={loading ? cl.half_opacity : null} src={preview}/>
							</div>
						:
						<div className={cl.empty_img}> Выберите изображение </div>
					}
				</div>
				<div className={loading ? cl.buttons_disabled : cl.buttons}>
					{pick_file && pick
					?
						<Button_Default
							onClick={()=>{set_avatar(); set_pick(false); set_file(null)}}
						>
							Установить
						</Button_Default>
					:
						old_avatar &&
						<Button_Default
							onClick={()=>{remove_group_avatar()}}
						>
							Удалить
						</Button_Default>
					}
					<Button_Default
						onClick={()=>{rechange()}}
					>
						{pick_file
						?
							'Заменить'
						:
							'Выбрать'
						}
					</Button_Default>
				</div>
			</div>
		</div>
	)
};

export default Form;