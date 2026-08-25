import React, { useState, useEffect, useRef } from 'react';
import cl from './form_selecter.module.css';

export const Form_Selecter = ({values, close, set_type_new_record}) => {
	const [items, set_items] = useState([]);
	useEffect(()=>{
		if( values instanceof Array ){
			set_items(values);
		}
	},[]);

	return (
		<div className={cl.form}>
			<div className={cl.close}>
				<div className={cl.close_it} onClick={close}>
					Отменить
				</div>
			</div>
			{items.length > 0 &&
				items.map((item, index) => 
					<div key={index} className={cl.item}>
						<div className={cl.item_name} onClick={()=>{
							if( item.func instanceof Function ){
								item.func();
							};
							set_type_new_record(item.type)
						}}>
							{item.name}
						</div>
					</div>
				)
			}
		</div>
	);
};

export default Form_Selecter;