import React, {useState, useEffect} from 'react';
import cl from './password_panel.module.css';
import Input_Default from '../inputs/input_default/input_default';

export const Password_Panel = ({value, set_value, placeholder, func_click, info_text, type}) => {

	return (
		<div className={cl.panel}>
			<div className={cl.center}>
				<div className={cl.subscribe}>
					{info_text}
				</div>
			</div>
			<div className={cl.center}>
				<div className={cl.password_panel}>
					<Input_Default
						value={value}
						onChange={e=>set_value(e.target.value)}
						placeholder={placeholder}
						type={type}
					></Input_Default>
					<div className={cl.button_enter} onClick={func_click}>
						войти
					</div>
				</div>
			</div>
		</div>
	)
};

export default Password_Panel;