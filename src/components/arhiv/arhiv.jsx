import React, {useState, useEffect} from 'react';
import cl from './arhiv.module.css';
import View_For_Images from '../../components/view_for_images/view_for_images.jsx';

export const Arhiv = ({posts, images, return_normal_images, close, open_view, close_view, set_current_img_for_view, return_new_images_array, return_type_arhiv}) => {

	// posts - это ПОСТЫ
	// return_normal_images - это функция возвращения переделаных изображений: NAME и PATH, но её использовать нужно в редких случаях, если IMAGES, передаваемое сюда пустое.
	// images - это NAME и PATH;
	// close - функция закрытия архива
	// open_view - функция открытия простотрщика
	// close_vies - функция закрытия просмотрщика
	// set_current_img_for_view - это изображение для просмотрщика. По типу img: img, index: index, где img - src;

	const [ normal_images, set_normal_images ] = useState([]);
	const [ top_in_bottom, set_top_in_bottom ] = useState('bottom');
	const [ visiable_view_for_images, set_visiable_view_for_images ] = useState(false);
	const [ new_images_array, set_new_images_array ] = useState([]);
	const [ visible_images, set_visible_images ] = useState([]); // видимые изображения для view_for_images.js
	const [ hidden_images, set_hidden_images ] = useState([]); // скрытые изображения для view_for_images.js

	useEffect(()=>{
		// в группу выводим тип архива
		if( top_in_bottom ){
			return_type_arhiv(top_in_bottom)
		}
	},[top_in_bottom])

	useEffect(()=>{
		if( posts.length > 0 ){
			const unique_indexes = new Set();
			let indexes = 0;
			images && images.length > 0 &&
				posts.slice().reverse().map((post, index)=>
					post?.images.map((raw_img, raw_index) =>
						JSON.parse(raw_img).map((img, img_index) => 
							{
								if( !unique_indexes.has(img_index) ){
									unique_indexes.add(img_index);
									const img_data = {
										path: images.find(image => image.name.toString() === img.data?.loaded_file?.full_name.toString())?.path,
										name: images.find(image => image.name.toString() === img.data?.loaded_file?.full_name.toString())?.name,
										hide: post?.hide,
										index: indexes,
									};
									indexes++;
									set_new_images_array(new_images_array => [...new_images_array, img_data]);
								}
								else {
									const img_data = {
										path: images.find(image => image.name.toString() === img.data?.loaded_file?.full_name.toString())?.path,
										name: images.find(image => image.name.toString() === img.data?.loaded_file?.full_name.toString())?.name,
										hide: post?.hide,
										index: indexes,
									};
									indexes++;
									set_new_images_array(new_images_array => [...new_images_array, img_data]);
								}
							}
						)
					)
				)
		}
	},[posts, images])

	useEffect(()=>{
		set_visible_images([])
		set_hidden_images([]);
		// для видимых изображений
		let indexes_for_visible_images = 0;
		let indexes_for_hidden_images = 0;
		if( new_images_array.length > 0 ){
			new_images_array.forEach(image => {
				if( image?.hide === 'false' ){
					set_visible_images(visible_images => [...visible_images, {...image, index: indexes_for_visible_images++}]);
				};
				if( image?.hide === 'true' ){
					set_hidden_images(hidden_images => [...hidden_images, {...image, index: indexes_for_hidden_images++}]);
				}
			})
		}
	},[new_images_array])

	useEffect(()=>{
		if( visible_images.length > 0 ){
			console.log('visible_images = ', visible_images)
		}
	},[visible_images])

	useEffect(()=>{
		if( new_images_array.length > 0 ){
			console.log('new_images_array = ', new_images_array)
		}
	},[new_images_array])

	return (
		<div className={cl.arhiv}>
			<div className={cl.row}>
				<div className={cl.row_item}>
					{/* <div className={cl.text}> */}
					{/* 	Сортирвка по */}
					{/* </div> */}
					<div className={top_in_bottom === 'top' ? cl.button_active : cl.button} onClick={()=>{set_top_in_bottom('bottom')}}>
						Новее
					</div>
					<div className={top_in_bottom === 'bottom' ? cl.button_active : cl.button} onClick={()=>{set_top_in_bottom('top')}}>
						Старые
					</div>

				</div>
				<div className={cl.row_item}>
					<div className={cl.button_close} onClick={()=>{close()}}>
						Закрыть
					</div>
				</div>
			</div>
			<div className={cl.block_blur_top}>
				{/* blur */}
				<div className={cl.blur_item_1}></div>
				<div className={cl.blur_item_0_8}></div>
				<div className={cl.blur_item_0_6}></div>
				<div className={cl.blur_item_0_4}></div>
				<div className={cl.blur_item_0_2}></div>
				<div className={cl.blur_item_0}></div>
			</div>
			<div className={cl.images}>
				<div className={cl.grid}>
					{posts && posts.length > 0 && images && images.length > 0
					&&	
						top_in_bottom === 'top'
						?
							visible_images && visible_images.length > 0 &&
								visible_images.slice().reverse().map((image, image_index) => 
									<div key={image_index} className={cl.img}>
										<img onClick={()=>{open_view(); set_current_img_for_view({
											img: image?.path,
											img_index: image?.index,
										})}} src={image?.path} alt="картинка"/>
									</div>	
								)
							
						:
							visible_images && visible_images.length > 0 &&
								visible_images.map((image, image_index) => 
									<div key={image_index} className={cl.img}>
										<img onClick={()=>{open_view(); set_current_img_for_view({
											img: image?.path,
											img_index: image?.index,
										})}} src={image?.path} alt="картинка"/>
									</div>	
								)
					}
				</div>
				{posts && posts.length === 0 && images && images.length === 0 &&
					<div className={cl.flex_block}>
						архив пустой
					</div>
				}
			</div>
			<div className={cl.block_blur_bottom}>
				{/* blur */}
				<div className={cl.blur_item_0}></div>
				<div className={cl.blur_item_0_2}></div>
				<div className={cl.blur_item_0_4}></div>
				<div className={cl.blur_item_0_6}></div>
				<div className={cl.blur_item_0_8}></div>
				<div className={cl.blur_item_1}></div>
			</div>
		</div>
	)
}

export default Arhiv;