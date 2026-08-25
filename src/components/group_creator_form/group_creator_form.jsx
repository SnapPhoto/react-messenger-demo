import React, {useState, useEffect, useRef} from 'react';
import Button_Default from '../buttons/button_default/button_default.jsx';
import cl from './group_creator_form.module.css';
import '../../App.css';
import Input_Default from '../inputs/input_default/input_default';
import Check_Selecter from '../check_selecter/check_selecter';
import Loader from '../loader/loader.jsx';

export const Group_Creator_Form = ({set_create_group_panel, set_data_for_create_group, style_block, set_style_block, false_block, set_false_block}) => {

	const [group_name, set_group_name] = useState('');
	const [file, set_file] = useState('');
	const [settings, set_settings] = useState({
		type_group: null,
	});
	const [group_password, set_group_password] = useState('');
	const [preview_img, set_preview_img] = useState();
	const [preview_max_img, set_preview_max_img] = useState();
	const [ type_group, set_type_group ] = useState('Открытая');

	async function Create_Preview_Img(file){
		const preview = URL.createObjectURL(file);
		if( preview ){
			set_preview_img(preview);
		}
		else{
			console.error('Ошибка создлания предпросмотра');
		}
	};

	useEffect(()=>{
		if( file ){
			console.log('Файл = ', file)
			Create_Preview_Img(file);
		}
	},[file]);

	useEffect(()=>{
		if( preview_img ){
			console.log('Предпросмотр создан: ', preview_img)
		}
	},[preview_img]);

	function open_preview_img(url){
		if( url ){
			set_preview_max_img(url);
		}
	};

	async function create_group(){
		if( settings.type_group === null ){
			return;
		};
		console.log('ВЫПОЛНЕНИЕ ФУНКЦИИ CREATE_GROUP()')
		const group_data = {
			group_name: group_name.trim(),
			group_img: file || '',
			group_settings: settings || {},
		};
		if( group_data.group_name.trim() !== '' && settings.type_group !== null){
			set_data_for_create_group(group_data);
			set_style_block(false)
			set_group_name('');
			set_file('');
			set_settings({
				type_group: type_group,
				password: '',
			});
			set_group_password('');
		}
	};

	useEffect(()=>{
		if( type_group !== null ){
			set_settings(settings => ({...settings, type_group: type_group}));
		};
		if( type_group === 'Открытая' && type_group !== null ){
			set_group_password('');
			set_settings(settings => ({...settings, password: ''}))
		};
		if( type_group !== null && group_password.length > 0 ){
			set_settings(settings => ({...settings, password: group_password}));
		};
	},[type_group, group_password]);

	useEffect(()=>{
		if( settings ){
			console.log(settings)
		}
	},[settings])


	// НУЖНО СДЕЛАТЬ: настроить создание titles, а то они не создаются
	// ЕЩЁ поиск групп,
	// ЕЩЁ в группах сделать2 вкладки (1 - все, 2 - мои )

	return (
		<div className={!false_block ? cl.group_creator_form : cl.group_creator_form_error} onMouseEnter={()=>{set_false_block(false)}}>
			{!style_block &&
				<div className={cl.loader}>
					<Loader></Loader>
				</div>
			}
			<div className='group-creator-form' style={{
				opacity: !style_block ? '0.5' : '1',
				pointerEvents: !style_block ? 'none' : '',
			}}>	
				<form onSubmit={(e)=>{e.stopPgopagation()}}>
					<div className='group-creator-form-close-button'>
						<Button_Default
							onClick={()=>{set_create_group_panel(false)}}
						>Закрыть</Button_Default>
					</div>
					<div className='group-creator-form-name row'>
						Название: <Input_Default
							type={'text'}
							value={group_name}
							onChange={(e)=>{set_group_name(e.target.value)}}
						></Input_Default>
					</div>
					{preview_max_img &&
						<div className='group-creator-form-preview-max-img' onClick={(e)=>{set_preview_max_img()}}>
							<img src={preview_img}/>
						</div>
					}
					<div className='group-creator-form-img row'>
						Изображение:
						{file 
						? 	
							<div className='row'>
								<div>
									<div className='group-creator-preview-img'>
										<img className='img_for_profil_group' src={preview_img} onClick={(e)=>{open_preview_img(e.target.src)}}/>
									</div>
								</div>
								<div className='file-is-selected' onClick={()=>{set_file(''); document.querySelector('.group-creator-form-select-img-file').value = ''}}>
									<div className='cancel-file-button'>
										x
									</div>
								</div>
							</div>
						
						:
							<div 
								className='group-creator-form-select-img' 
								onClick={()=>{
									document.querySelector('.group-creator-form-select-img-file').value = ''; 
									document.querySelector('.group-creator-form-select-img-file').click()}}
							>выбрать
							</div> 
						}
						<input className={`${cl.group_creator_form_img_hiden} group-creator-form-select-img-file`} type="file" onChange={e => set_file(e.target.files[0]) }/>
					</div>
					<div style={{margin: '10px 0'}}>
						Настройки
					</div>
					<div className='group-creator-form-settings row'>
						<div>
							Тип группы:
						</div> 
						<div>
							<Check_Selecter
								first_value={'Закрытая'}
								second_value={'Открытая'}
								current_value={type_group}
								return_value={set_type_group}
							></Check_Selecter>
						</div>
					</div>
					{type_group === 'Закрытая' &&
						<div className='group-creator-form-settings row'>
							<div>
								Пароль:
							</div> 
							<div>
								<Input_Default
									value={group_password}
									onChange={(e)=>{set_group_password(e.target.value)}}
									placeholder={''}
									type={'password'}
									maxLength={'20'}
									style={{width: '100%'}}
									required={true}
								></Input_Default>
							</div>
						</div>
					}
					<div className='create-form-button'>
						<Button_Default
							onClick={(e)=>{e.preventDefault(); create_group()}}
						>	
						Создать
						</Button_Default>
					</div>
				</form>
			</div>
		</div>
	)
};

export default Group_Creator_Form;