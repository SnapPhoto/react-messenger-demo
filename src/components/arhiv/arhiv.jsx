import React, {useState, useEffect} from 'react';
import cl from './arhiv.module.css';

function normalizeArchiveImages(images){
	let value = images;
	if( typeof value === 'string' ){
		try { value = JSON.parse(value); } catch { return []; }
	}
	if( !Array.isArray(value) ) return [];
	const result = [];
	for( const entry of value ){
		let parsed = entry;
		if( typeof parsed === 'string' ){
			try { parsed = JSON.parse(parsed); } catch { continue; }
		}
		for( const item of Array.isArray(parsed) ? parsed : [parsed] ){
			if( typeof item === 'string' ){
				try {
					const decoded = JSON.parse(item);
					result.push(...(Array.isArray(decoded) ? decoded : [decoded]));
				}
				catch { continue; }
			}
			else if( item && typeof item === 'object' ) result.push(item);
		}
	}
	return result;
}

export const Arhiv = ({posts, images, return_normal_images, close, open_view, close_view, set_current_img_for_view, return_new_images_array, return_type_arhiv}) => {

	// posts - это ПОСТЫ
	// return_normal_images - это функция возвращения переделаных изображений: NAME и PATH, но её использовать нужно в редких случаях, если IMAGES, передаваемое сюда пустое.
	// images - это NAME и PATH;
	// close - функция закрытия архива
	// open_view - функция открытия простотрщика
	// close_vies - функция закрытия просмотрщика
	// set_current_img_for_view - это изображение для просмотрщика. По типу img: img, index: index, где img - src;

	const [ top_in_bottom, set_top_in_bottom ] = useState('bottom');
	const [ new_images_array, set_new_images_array ] = useState([]);
	const [ visible_images, set_visible_images ] = useState([]); // видимые изображения для view_for_images.js

	useEffect(()=>{
		// в группу выводим тип архива
		if( top_in_bottom ){
			return_type_arhiv(top_in_bottom)
		}
	},[top_in_bottom])

	useEffect(()=>{
		const next_images = [];
		const filename_of = (value) => typeof value === 'string' ? value.split(/[\\/]/).pop() : '';
		for( const post of posts.slice().reverse() ){
			for( const img of normalizeArchiveImages(post?.images) ){
				const loaded = img?.data?.loaded_file || img?.loaded_file || {};
				const names = [loaded.name, loaded.file_name, loaded.full_name, loaded.path]
					.map(filename_of).filter(Boolean);
				if( names.length === 0 ) continue;
				const found = images.find(image =>
					[image?.name, image?.file_name, image?.full_name, image?.path]
						.some(asset_name => names.includes(filename_of(asset_name)))
				);
				if( found ) next_images.push({path: found.path, name: found.full_name || found.name || names[0], hide: post?.hide, index: next_images.length});
			}
		}
		set_new_images_array(next_images);
	},[posts, images]);

	useEffect(()=>{
		const is_hidden = value => value === true || value === 'true';
		set_visible_images(new_images_array.filter(image => !is_hidden(image?.hide)).map((image,index)=>({...image,index})));
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
					{visible_images.length > 0 && (top_in_bottom === 'top' ? visible_images.slice().reverse() : visible_images).map((image, image_index) =>
						<div key={`${image.name || image.path}-${image_index}`} className={cl.img}>
							<img onClick={()=>{open_view(); set_current_img_for_view({img: image?.path, name: image?.name, img_index: image?.index})}} src={image?.path} alt="картинка"/>
						</div>
					)}
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