import React, {useState, useEffect} from 'react';
import cl from './classes.module.css';
import Button_Default from '../buttons/button_default/button_default.jsx';

export const Add_title = ({close, value, set_value, placeholder, save, old_title}) => {

	useEffect(()=>{
		if( old_title ){
			set_value(old_title)
		}
	},[old_title])

	return (
		<div className={cl.add_title} onClick={()=>{close(false); set_value('')}}>
			<div className={cl.form} onClick={(e)=>{e.stopPropagation()}}>
				<div className={cl.close} onClick={()=>{close(false); set_value('')}}> 
					 x
				</div>
				<div>
					Описание
				</div>
				<textarea 
					className={cl.textarea}
					value={value}
					onChange={(e)=>{set_value(e.target.value)}}
					placeholder={placeholder}
					maxLength='300'
				></textarea>
				<div className={cl.button}>
					<Button_Default
						onClick={()=>{save()}}
					>
						Применить изменения
					</Button_Default>
				</div>
			</div>
		</div>
	)
};

export default Add_title;