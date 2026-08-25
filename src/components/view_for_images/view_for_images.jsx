import React, {useState, useEffect} from 'react';
import cl from './view_for_images.module.css';

export const View_For_Images = ({current_index_img, images, visible_images, hidden_images, current_img, set_current_img, close, type_arhiv, type_view, visible_arhiv, for_current_mails, images_for_current_mails, images_from_max, normal_images_from_current_mails, data_for_view_for_current_mails, normal_images_for_main_from_group, data_for_view_for_main}) => {
	
	const [ new_images_array, set_new_images_array ] = useState([]);
	const [ current_index, set_current_index ] = useState(0); //индекс для всех изображений
	const [ current_index_for_visible_images, set_current_index_for_visible_images ] = useState(0); //индекс для видимых изображений
	const [ current_index_for_hidden_images, set_current_index_for_hidden_images ] = useState(0); //индекс для скрытых изображений

	// normal_images - это пропущенные через инденсификацию фотки;
	// type_arhiv - это вариант отображения архива. (Старые / Новые);
	// hidden_images - это скрытые изображения;
	// visible_images - это видимые изображения;
	// type_view - это показатель отображения изображений. (visible, hidden, favourite, current_mails, main);
	// for_current_mails - проверка, просмотр для сообщений?

	// !!!!!!! 

	// data_for_view_for_current_mails - может иметь значения как для current_mails, так и для for_main;
	
	// !!!!!!! 

	// images - фотки. Вид: 
	// normal_images_for_main_from_group - массив фоток для main. Вид: path:'', name:'';

	// useEffect(()=>{
	// 	if( data_for_view_for_current_mails !== null ){
	// 		console.log('[view_for_images] data_for_view_for_current_mails = ', data_for_view_for_current_mails);
	// 		set_current_index(data_for_view_for_current_mails?.current_img_index);
	// 	}
	// 	else{
	// 		console.log('[24] data_for_view_for_current_mails = NULL или пусто')
	// 	}
	// },[data_for_view_for_current_mails]);

	useEffect(()=>{
		// console.log('_______] view_for_images | visible_images = ', visible_images);
		// console.log('_______] images = ', images);
		if( type_view === 'main' ){
			let new_images = [];
			images.map(arr=>{
				arr.map((image_data)=>{
					if( image_data?.images ){
						image_data?.images.map((image)=>{
							const parsed_image_data = JSON.parse(image);
							if( parsed_image_data ){
								console.log('[42] parsed_image_data = ', parsed_image_data)
							}
						})
					}
				})
			})
		}
	},[visible_images, images])

	useEffect(()=>{
		// console.log('_____________] current_img = ', current_img)
		if( type_view === 'visible' ){
			// console.log('__current_img = ', current_img);
			// console.log('__visible_img = ', visible_images);
			// console.log('')
			if( !visible_arhiv && visible_images !== null){
				// console.log('_1_selected_index = ', (visible_images.find(image => image?.name === current_img?.name)?.index) || data_for_view_for_current_mails?.current_img_index )
				set_current_index(visible_images.find(image => image?.name === current_img?.name)?.index);
			}
			else {
				// console.log('_2_selected_index = ', current_img?.img_index);
				set_current_index(current_img?.img_index);
			}
		};
		if( type_view === 'hidden' ){
			// console.log('__current_img = ', current_img);
			// console.log('__hidden_img = ', hidden_images);
			// console.log('')
			if( !visible_arhiv ){
				// console.log('_1_selected_index = ', hidden_images.find(image => image?.name === current_img?.name)?.index)
				set_current_index(hidden_images.find(image => image?.name === current_img?.name)?.index);
			}
			else {
				// console.log('_2_selected_index = ', current_img?.img_index);
				set_current_index(current_img?.img_index);
			}
		};
		if( type_view === 'favourite' ){
			// console.log('__current_img = ', current_img);
			// console.log('__hidden_img = ', hidden_images);
			// console.log('__images = ', images)
			// console.log('')
			if( !visible_arhiv ){
				if( images !== null && images.length > 0 ){
					// console.log('_1_selected_index = ', images.indexOf(current_img));
					set_current_index( images.indexOf(current_img) );
				}
			}
			else {
				// console.log('_2_selected_index = ', current_img?.img_index);
				set_current_index(current_img?.img_index);
			}
		};
		if( type_view === 'main' ){
			// console.log('[main] img = ', current_img);
			// console.log('[main]  visible_img = ', data_for_view_for_current_mails?.normal_images_for_main_from_group);
			// console.log('[main] images = ', data_for_view_for_current_mails?.images)
			// console.log('')
			if( !visible_arhiv ){
				if( images !== null && images.length > 0 ){
					// console.log('_1_selected_index = ', data_for_view_for_current_mails?.current_img_index);
					set_current_index(data_for_view_for_current_mails?.current_img_index);
				}
			}
			else {
				// console.log('_2_selected_index = ', data_for_view_for_current_mails?.current_img_index);
				set_current_index(data_for_view_for_current_mails?.current_img_index);
			}
		}
	},[current_img, type_view])

	function next_img(){
		// следующее изображение
		if( type_view === 'visible' ){
			if ( type_arhiv === 'bottom' ){
				if( visible_images.length > 0 ){
					if( current_index < visible_images.length-1 ){
						// console.log('images.length = ', images.length);
						// console.log('current_index = ', current_index);
						set_current_index(current_index+1)
					}
					else {
						set_current_index(0);
					}
				}
			}
			else if( type_arhiv === 'top' ){
				if( visible_images.length > 0 ){
					if( current_index > 0 ){
						set_current_index(current_index-1)
					}
					else{
						set_current_index(visible_images.length-1)
					}
				}
			}
			else if( !type_arhiv ){
				if( visible_images.length > 0 ){
					if( current_index < visible_images.length-1 ){
						// console.log('images.length = ', images.length);
						// console.log('current_index = ', current_index);
						set_current_index(current_index+1)
					}
					else {
						set_current_index(0);
					}
				}
			}
		};
		if( type_view === 'hidden' ){
			if ( type_arhiv === 'bottom' ){
				if( hidden_images.length > 0 ){
					if( current_index < hidden_images.length-1 ){
						// console.log('images.length = ', images.length);
						// console.log('current_index = ', current_index);
						set_current_index(current_index+1)
					}
					else {
						set_current_index(0);
					}
				}
			}
			else if( type_arhiv === 'top' ){
				if( hidden_images.length > 0 ){
					if( current_index > 0 ){
						set_current_index(current_index-1)
					}
					else{
						set_current_index(hidden_images.length-1)
					}
				}
			}
			else if( !type_arhiv ){
				if( hidden_images.length > 0 ){
					if( current_index < hidden_images.length-1 ){
						// console.log('images.length = ', images.length);
						// console.log('current_index = ', current_index);
						set_current_index(current_index+1)
					}
					else {
						set_current_index(0);
					}
				}
			}
		};
		if( type_view === 'favourite' ){
			if ( type_arhiv === 'bottom' ){
				if( visible_images.length > 0 ){
					if( current_index < visible_images.length-1 ){
						// console.log('images.length = ', images.length);
						// console.log('current_index = ', current_index);
						set_current_index(current_index+1)
						console.log('current_index = ', current_index)
					}
					else {
						set_current_index(0);
						console.log('current_index = ', current_index)
					}
				}
			}
			else if( type_arhiv === 'top' ){
				if( visible_images.length > 0 ){
					if( current_index > 0 ){
						set_current_index(current_index-1)
						console.log('current_index = ', current_index)
					}
					else{
						set_current_index(visible_images.length-1)
						console.log('current_index = ', current_index)
					}
				}
			}
			else if( !type_arhiv ){
				if( visible_images.length > 0 ){
					if( current_index < visible_images.length-1 ){
						// console.log('images.length = ', images.length);
						// console.log('current_index = ', current_index);
						set_current_index(current_index+1)
						console.log('current_index = ', current_index)
					}
					else {
						set_current_index(0);
						console.log('current_index = ', current_index)
					}
				}
			}
		};
		if( type_view === 'current_mails' ){
			if ( type_arhiv === 'bottom' ){
				if( visible_images.length > 0 ){
					if( current_index < visible_images.length-1 ){
						// console.log('images.length = ', images.length);
						// console.log('current_index = ', current_index);
						set_current_index(current_index+1)
						console.log('current_index = ', current_index)
					}
					else {
						set_current_index(0);
						console.log('current_index = ', current_index)
					}
				}
			}
			else if( type_arhiv === 'top' ){
				if( visible_images.length > 0 ){
					if( current_index > 0 ){
						set_current_index(current_index-1)
						console.log('current_index = ', current_index)
					}
					else{
						set_current_index(visible_images.length-1)
						console.log('current_index = ', current_index)
					}
				}
			}
			else if( !type_arhiv ){
				if( visible_images.length > 0 ){
					if( current_index < visible_images.length-1 ){
						// console.log('images.length = ', images.length);
						// console.log('current_index = ', current_index);
						set_current_index(current_index+1)
						console.log('current_index = ', current_index)
					}
					else {
						set_current_index(0);
						console.log('current_index = ', current_index)
					}
				}
			}
		};
		if( type_view === 'main' ){
			if ( type_arhiv === 'bottom' ){
				if( data_for_view_for_current_mails?.images.length > 0 ){
					if( current_index < data_for_view_for_current_mails?.images.length-1 ){
						// console.log('images.length = ', images.length);
						// console.log('current_index = ', current_index);
						set_current_index(current_index+1)
						// console.log('current_index = ', current_index)
					}
					else {
						set_current_index(0);
						// console.log('current_index = ', current_index)
					}
				}
			}
			else if( type_arhiv === 'top' ){
				if( data_for_view_for_current_mails?.images.length > 0 ){
					if( current_index > 0 ){
						set_current_index(current_index-1)
						console.log('current_index = ', current_index)
					}
					else{
						set_current_index(data_for_view_for_current_mails?.images.length-1)
						console.log('current_index = ', current_index)
					}
				}
			}
			else if( !type_arhiv ){
				if( visible_images.length > 0 ){
					if( current_index < visible_images.length-1 ){
						// console.log('images.length = ', images.length);
						// console.log('current_index = ', current_index);
						set_current_index(current_index+1)
						console.log('current_index = ', current_index)
					}
					else {
						set_current_index(0);
						console.log('current_index = ', current_index)
					}
				}
			}
		};
	}
	function previous_img(){
		// предыдущее изображение
		if( type_view === 'visible' ){
			if( type_arhiv === 'bottom' ){
				if( visible_images.length > 0 ){
					if( current_index > 0 ){
						set_current_index(current_index-1)
					}
					else{
						set_current_index(visible_images.length-1)
					}
				}
			}
			else if( type_arhiv === 'top' ){
				if( visible_images.length > 0 ){
					if( current_index < visible_images.length-1 ){
						// console.log('images.length = ', images.length);
						// console.log('current_index = ', current_index);
						set_current_index(current_index+1)
					}
					else {
						set_current_index(0);
					}
				}
			}
			else if( !type_arhiv ){
				if( visible_images.length > 0 ){
					if( current_index > 0 ){
						set_current_index(current_index-1)
					}
					else{
						set_current_index(visible_images.length-1)
					}
				}
			}
		};
		if( type_view === 'hidden' ){
			if( type_arhiv === 'bottom' ){
				if( hidden_images.length > 0 ){
					if( current_index > 0 ){
						set_current_index(current_index-1)
					}
					else{
						set_current_index(hidden_images.length-1)
					}
				}
			}
			else if( type_arhiv === 'top' ){
				if( hidden_images.length > 0 ){
					if( current_index < hidden_images.length-1 ){
						// console.log('images.length = ', images.length);
						// console.log('current_index = ', current_index);
						set_current_index(current_index+1)
					}
					else {
						set_current_index(0);
					}
				}
			}
			else if( !type_arhiv ){
				if( hidden_images.length > 0 ){
					if( current_index > 0 ){
						set_current_index(current_index-1)
					}
					else{
						set_current_index(hidden_images.length-1)
					}
				}
			}
		};
		if( type_view === 'favourite' ){
			if( type_arhiv === 'bottom' ){
				if( visible_images.length > 0 ){
					if( current_index > 0 ){
						set_current_index(current_index-1)
						console.log('current_index = ', current_index)
					}
					else{
						set_current_index(visible_images.length-1)
						console.log('current_index = ', current_index)
					}
				}
			}
			else if( type_arhiv === 'top' ){
				if( visible_images.length > 0 ){
					if( current_index < visible_images.length-1 ){
						// console.log('images.length = ', images.length);
						// console.log('current_index = ', current_index);
						set_current_index(current_index+1)
						console.log('current_index = ', current_index)
					}
					else {
						set_current_index(0);
						console.log('current_index = ', current_index)
					}
				}
			}
			else if( !type_arhiv ){
				if( visible_images.length > 0 ){
					if( current_index > 0 ){
						set_current_index(current_index-1)
						console.log('current_index = ', current_index)
					}
					else{
						set_current_index(visible_images.length-1)
						console.log('current_index = ', current_index)
					}
				}
			}
		};
		if( type_view === 'current_mails' ){
			if( type_arhiv === 'bottom' ){
				if( visible_images.length > 0 ){
					if( current_index > 0 ){
						set_current_index(current_index-1)
						console.log('current_index = ', current_index)
					}
					else{
						set_current_index(visible_images.length-1)
						console.log('current_index = ', current_index)
					}
				}
			}
			else if( type_arhiv === 'top' ){
				if( visible_images.length > 0 ){
					if( current_index < visible_images.length-1 ){
						// console.log('images.length = ', images.length);
						// console.log('current_index = ', current_index);
						set_current_index(current_index+1)
						console.log('current_index = ', current_index)
					}
					else {
						set_current_index(0);
						console.log('current_index = ', current_index)
					}
				}
			}
			else if( !type_arhiv ){
				if( visible_images.length > 0 ){
					if( current_index > 0 ){
						set_current_index(current_index-1)
						console.log('current_index = ', current_index)
					}
					else{
						set_current_index(visible_images.length-1)
						console.log('current_index = ', current_index)
					}
				}
			}
		};
		if( type_view === 'main' ){
			if( type_arhiv === 'bottom' ){
				if( data_for_view_for_current_mails?.images.length > 0 ){
					if( current_index > 0 ){
						set_current_index(current_index-1)
						// console.log('current_index = ', current_index)
					}
					else{
						set_current_index(data_for_view_for_current_mails?.images.length-1)
						// console.log('current_index = ', current_index)
					}
				}
			}
			else if( type_arhiv === 'top' ){
				if( data_for_view_for_current_mails?.images.length > 0 ){
					if( current_index < data_for_view_for_current_mails?.images.length-1 ){
						// console.log('images.length = ', images.length);
						// console.log('current_index = ', current_index);
						set_current_index(current_index+1)
						console.log('current_index = ', current_index)
					}
					else {
						set_current_index(0);
						console.log('current_index = ', current_index)
					}
				}
			}
			else if( !type_arhiv ){
				if( visible_images.length > 0 ){
					if( current_index > 0 ){
						set_current_index(current_index-1)
						console.log('current_index = ', current_index)
					}
					else{
						set_current_index(visible_images.length-1)
						console.log('current_index = ', current_index)
					}
				}
			}
		}
	};

	function arrow_keys_down(e){
		const token = localStorage.getItem('token');
		if( !token ){
			return
		};
		if( e.key === 'ArrowRight' ){
			next_img();
		};
		if( e.key === 'ArrowLeft' ){
			previous_img();
		};
	};

	useEffect(()=>{
		const token = localStorage.getItem('token');
		if( !token ){
			return;
		};
		if( (data_for_view_for_current_mails || normal_images_from_current_mails || hidden_images || visible_images || images_from_max) && images ){
			document.addEventListener('keydown', arrow_keys_down);
		}
		else{
			return console.warn('Что-то не так с пред... arrow_keys_down');
		}
		return ()=>{
			document.removeEventListener('keydown', arrow_keys_down);
		};
	},[images, images_from_max, current_index]);

	function func_add_to_favourite(image){
		console.log('[420] image = ', image)
	}

	return (
		<div className={cl.gallery}>
			<div className={cl.fon} onClick={()=>{close()}}>
				{/* фон */}
			</div>
			<div className={cl.images_row} onClick={(e)=>{e.stopPropagation()}}>
				{/* изображения */}
				{type_view === 'visible'
				? 
					visible_images !== null && visible_images.length > 0
					?
						visible_images.map((image, index) =>
							image?.index === current_index &&
							<div key={index} className={cl.img_box}>
								<img src={image?.path} alt="картинка"/>
							</div>
						)
					:
						<div> пусто </div>
				: 
				type_view === 'hidden' 
				?
					hidden_images !== null && hidden_images.length > 0
					?
						hidden_images.map((image, index) =>
							image?.index === current_index &&
							<div key={index} className={cl.img_box}>
								<img src={image?.path} alt="картинка"/>
							</div>
						)
					:
						<div> пусто </div>
				:
				type_view === 'favourite' ?
						current_img &&
							images !== null && images.length > 0 
							?	
								//если более 1 картинки
								images.map((image, index) =>
									index === current_index &&
									<div className={cl.img_box} key={index}>
										<img src={image} alt="картинка"/>
									</div>
								)
							:
								//если 1 картинка
								<div className={cl.img_box}>
									<img src={current_img} alt="картинка"/>
								</div>
				:
				type_view === 'current_mails'
				?
					data_for_view_for_current_mails &&
						normal_images_from_current_mails !== null && normal_images_from_current_mails.length > 0 
							?
								//если более 1 картинки
								normal_images_from_current_mails.map((image, index) =>
									index === current_index &&
									<div className={cl.img_box} key={index}>
										{/* {console.log('index = ', index)} */}
										<img src={image.path} alt="картинка"/>
									</div>
								)
							: 	
								//если 1 картинка 
								data_for_view_for_current_mails?.current_img &&
								<div className={cl.img_box} style={{color: 'white'}}>
									{/* {console.log('current_index = ', data_for_view_for_current_mails?.current_index)} */}
									<img src={data_for_view_for_current_mails.find(data => data?.images.name === data?.current_img)?.images?.path} alt="картинка"/>
								</div>
				:
				type_view === 'main' &&
					data_for_view_for_current_mails &&
						data_for_view_for_current_mails?.normal_images_for_main_from_group !== null && data_for_view_for_current_mails?.normal_images_for_main_from_group.length > 0 && data_for_view_for_current_mails?.images !== undefined && data_for_view_for_current_mails?.images.length > 0
							?
								//если более 1 картинки
								data_for_view_for_current_mails?.images.map((image, index) =>
									index === current_index &&
									<div className={cl.img_box} key={index}>
										{/* {console.log('index = ', index)} */}
										<img src={image.path} alt="картинка"/>
									</div>
								)
							: 	
								//если 1 картинка 
								data_for_view_for_current_mails?.current_img &&
								<div className={cl.img_box} style={{color: 'white'}}>
									<img src={data_for_view_for_current_mails.find(data => data?.images.name === data?.current_img)?.images?.path} alt="картинка"/>
								</div>
				}
				<div className={cl.buttons}>
					{/* кнопки */}
					{images !== null && images.length > 1 &&
						<div className={cl.button_left} onClick={()=>{previous_img()}}>
							{/* влево */}
							{`<`}
						</div>
					}
					{images !== null && images.length > 1 &&
						<div className={cl.button_right} onClick={()=>{next_img()}}>
							{/* вправо */}
							{`>`}
						</div>
					}
					<div className={cl.button_close} onClick={close}>
						{/* закрыть */}
						Закрыть
					</div>
					{type_view !== 'favourite' &&
						<div className={cl.add_to_favourite} onClick={()=>{if(type_view === 'visible'){func_add_to_favourite(visible_images.filter((v_image,v_index)=>v_image?.index === current_index))} else if(type_view === 'hidden'){func_add_to_favourite(hidden_images.filter((h_image,h_index)=>h_image?.index === current_index))} else if(type_view === 'current_mails'){func_add_to_favourite(normal_images_from_current_mails.filter((n_image,n_index)=>n_index === current_index))}}}>
							Добавить в избранное
						</div>
					}
				</div>
			</div>
		</div>
	)
}

export default View_For_Images;