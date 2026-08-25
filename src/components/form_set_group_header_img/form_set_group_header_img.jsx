import React, {useState, useEffect} from 'react';
import cl from './form_set_group_header_img.module.css';
import Button_Default from '../../components/buttons/button_default/button_default.jsx';
import axios from 'axios';

export const Form = ({set_file, pick_file, set_visiable, set_avatar, old_header, group_id, refresh_group_data}) => {

	const [preview, set_preview] = useState(null);
	const [headers, set_headers] = useState([]);
	const [pick, set_pick] = useState(false);
	const [update_get_headers, set_update_get_headers] = useState(true);

	function get_headers(){ 
		if( !update_get_headers ){
			return;
		}
		set_headers([]);
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			let files = (context) => context.keys().map(context);
			const imgs = files(require.context('../../images/groups_headers/'), false, /\.(jpg)$/);
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
					set_headers(imgs_data);
					set_pick(false);
					set_update_get_headers(false);
				};
			};
			files = null;
		}
		catch(err){
			set_headers([])
			set_pick(false);
			return console.error('Ошибка: ', err);
		}
	};

	useEffect(()=>{
		if( old_header ){
			set_update_get_headers(true);
			get_headers();
		}
	},[old_header])

	useEffect(()=>{
		if( headers.length > 0 ){
			headers?.forEach(profil_header_data => {
				console.log( 'profil_header_data = ', profil_header_data);
				console.log('old_header = ', old_header)
				if( profil_header_data?.name === old_header ){
					console.log('profil_header_data?.path')
					set_preview(profil_header_data?.path)
					set_headers([]);
				}
			})
		}
	},[headers])

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
	},[pick_file])

	async function remove_group_header(){
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		try{
			const response = await axios.post('http://localhost:8080/remove_group_header', {
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
				set_headers([]);
				set_update_get_headers(true);
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
			<div className='panel_set_group_header_img_mini_panel' onClick={(e)=>{e.stopPropagation()}}>
				<form className={cl.form} onSubmit={(e)=>{e.preventDefault()}}>
					<input className='input_file' type="file" accept=".jpg" onChange={(e)=>{set_file(e.target.files)}}/>
				</form>
				<div className={cl.preview}>
					{preview !== null 
						?
						<img src={preview}/>
						:
						<div className={cl.empty_img}> Выберите изображение для шапки </div>
					}
				</div>
				<div className={cl.buttons}>
					{pick_file && pick
					?
						<Button_Default
							onClick={()=>{set_avatar(); set_pick(false); set_file(null)}}
						>
							Установить
						</Button_Default>
					:
						old_header 
						?
						<Button_Default
							onClick={()=>{remove_group_header()}}
						>
							Удалить
						</Button_Default>
						:
						null
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