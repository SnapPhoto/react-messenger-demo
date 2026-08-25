import React, {useState, useEffect, useRef} from 'react';
import cl from './user_events.module.css';

export const User_Events = ({buttons, visiable, set_visiable}) => {
	return (
		visiable &&
		<div className={cl.user_events} onMouseLeave={()=>{set_visiable(false)}}>
			{buttons.map((btn, index)=>
				btn.vis &&
				<div key={index} className={cl.button} onClick={btn?.func}>
					{btn && btn.text}
				</div>
			)}
		</div>
	)
};

export default User_Events;