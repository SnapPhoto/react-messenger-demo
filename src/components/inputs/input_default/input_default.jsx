import React, { useState } from 'react';
import cl from './input_default.module.css';

export const Input_Default = (props) => {
	return (
		<input {...props} type={props.type} className={cl.default}/>
	)
};

export default Input_Default;