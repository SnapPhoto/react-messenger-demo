import React, { useState, useEffect, useRef } from 'react';
import cl from './check_selecter.module.css';

export const Check_Selecter = ({first_value, second_value, current_value, return_value}) => {


	// DOM элементы
	const [first, set_first] = useState(null);
	const [second, set_second] = useState(null);
	const [switcher, set_switcher] = useState(null);


	// позиция DOM элементов
	const [first_pos, set_first_pos] = useState(null);
	const [second_pos, set_second_pos] = useState(null);
	const [switcher_pos, set_switcher_pos] = useState(null);


	// ref - объекты
	const first_obj_ref = useRef(null);
	const second_obj_ref = useRef(null);
	const switcher_obj_ref = useRef(null);

	useEffect(()=>{
		if( first_obj_ref.current && second_obj_ref.current && switcher_obj_ref.current ){
			set_first(first_obj_ref.current);
			set_second(second_obj_ref.current);
			set_switcher(switcher_obj_ref.current);
		};
	},[]);

	function pin(){
		const f_pos = first.getBoundingClientRect();
		const s_pos = second.getBoundingClientRect();
		const sw_pos = switcher.getBoundingClientRect();
		if( f_pos && s_pos && sw_pos ){
			set_first_pos(f_pos);
			set_second_pos(s_pos);
			set_switcher_pos(sw_pos);
		};
		if( f_pos && s_pos && sw_pos){
			switcher.style.transition = 'left 0.2s, transform 0.2s, width 0.2s';
			switcher.style.display = 'block';
			switcher.style.position = 'absolute';
			switcher.style.width = `${current_value === first_value ? f_pos.width + 'px' : s_pos.width + 'px'}`;
			switcher.style.height = `${current_value === first_value ? f_pos.height + 'px' : s_pos.height + 'px'}`;
			switcher.style.border = '1px solid black';
			// switcher.style.left = `${current_value === first_value ? f_pos.x - f_pos.x + 'px' : s_pos.x - s_pos.x + s_pos.width + 15 + 'px'}`;
			switcher.style.left = `${current_value === first_value ? '0%' : '100.5%'}`;
			switcher.style.transform = `${current_value === first_value ? 'translateX(0%)' : 'translateX(-100%)'}`
			switcher.style.padding = '0 10px';
			switcher.style.borderRadius = '25px';
			switcher.style.zIndex = '0';
			switcher.style.backgroundColor = 'gray';

			first.style.zIndex = '1';
			second.style.zIndex = '1';
		};
		first.onclick = () => {
			return_value(first_value);
		};
		second.onclick = () => {
			return_value(second_value);
		};
	};

	useEffect(()=>{
		if( first !== null && second !== null && switcher !== null ){
			first.style.margin = '0 10px';
			second.style.margin = '0 10px';
			pin();
		};
		function handler_resize(){
			pin();
		};
		window.addEventListener('resize', handler_resize);
		return ()=>{window.removeEventListener('resize', handler_resize)}
	},[first, second, switcher, current_value]);

	return (
		<div className={`${cl.check_selecter} row`}>
			<div ref={switcher_obj_ref} className={`${cl.switch_block}`}>
			</div>
			<div ref={first_obj_ref} className={`${cl.first_value}`}>
				{first_value}
			</div>
			<div ref={second_obj_ref} className={`${cl.second_value}`}>
				{second_value}
			</div>
		</div>
	)
};

export default Check_Selecter;