import React, { useState } from 'react';
import cl from './button_default.module.css';

export const Button_Default = (props) => {
	return (
		<button {...props} className={cl.default}> {props.children} </button>
	)
};

export default Button_Default;