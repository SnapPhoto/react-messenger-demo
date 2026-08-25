import React, { useState, useEffect, useMemo } from 'react';
import Input from '../../components/inputs/input_default/input_default.jsx';
import Button from '../../components/buttons/button_default/button_default.jsx';
import cl_s from './search.module.css';
import cl_i from '../inputs/input_default/input_default.module.css';

export const Searcher = ({value, default_value, set_value, who_sender, my_id, other, other_func, return_result}) => {

	//other - любая переменная, можно и без неё

	const [s_text, set_s_text] = useState('');
	useEffect(()=>{
		if( other ){
			set_s_text('');
			set_value(default_value);
		}
	},[other])

	const filtered_peoples = useMemo(()=>{
		if( s_text !== undefined && s_text !== null && s_text.trim().length > 0 && s_text.trim('') !== '' && s_text.trim('').length > 0 ){
			if( default_value.length > 0 ){
				let filtered_result = [];
				default_value.map((d)=>{
					if( d?.name ){
						// console.log('поиск по "name"');
						const result = default_value.filter(d_value=>d_value?.name.toLowerCase().includes(s_text?.toLowerCase()));
						if( result.length > 0 ){
							console.log('result = ', result)
							filtered_result = result;
						}
						else{
							return [];
						}
					};
					if( d?.name_to_send && d?.name_sender ){
						console.log('поиск по "name_to_send && name_sender"')
						const result = default_value.filter(d_value=>d_value?.name_to_send.toLowerCase().includes(s_text.toLowerCase()) + d_value?.name_sender.toLowerCase().includes(s_text.toLowerCase()));
						if( result.length > 0 ){
							console.log('result = ', result)
							filtered_result = result;
						}
						else{
							return [];
						}
					};
					if( d?.group_name ){
						// console.log('поиск по "group_name"')
						const result = default_value.filter(d_value=>d_value?.group_name.toLowerCase().includes(s_text.toLowerCase()));
						if( result.length > 0 ){
							console.log('result = ', result)
							filtered_result = result;
						}
						else{
							return [];
						}
					};
					if( d?.text ){
						// console.log('поиск по "text"')
						const result = default_value.filter(d_value=>d_value.text.toLowerCase().includes(s_text.toLowerCase()));
						if( result.length > 0 ){
							console.log('result = ', result)
							filtered_result = result;
						}
						else{
							return [];
						}
					};
					if( d?.invite_data?.name_from ){
						// console.log('поиск по "invite_data?.name_from"')
						const result = default_value.filter(d_value=>d_value.invite_data?.name_from.toLowerCase().includes(s_text.toLowerCase()));
						if( result.length > 0 ){
							console.log('result = ', result)
							filtered_result = result;
						}
						else{
							return [];
						}
					};
				})
				return filtered_result;
			}
		}
		else{
			return default_value;
		}
	},[s_text, default_value])

	useEffect(()=>{
		if(filtered_peoples !== undefined && filtered_peoples.length > 0 ){
			// console.log('filtered_peoples = ', filtered_peoples)
			set_value(filtered_peoples)
		}
		else{
			// console.log('default_value = ', default_value);
			set_value([])
		}
	},[filtered_peoples])


	// НИЖЕ СТАРАЯ ВЕРСИЯ (РАБОЧАЯ, НО ВЫДАЁТ МУТАЦИЮ);
	// useEffect(()=>{
	// 	if( s_text.length > 0){
	// 		if( default_value.length > 0 ){
	// 			default_value.map((v)=>{
	// 				console.log(v)
	// 				if( v.name ){
	// 					const searchered_value = default_value.filter(v=>v.name.toLowerCase().includes(s_text.toLowerCase()));
	// 					set_value(value => [...searchered_value])
	// 					console.log('searcher 1')
	// 				}
	// 				else if( v.name_to_send && v.name_sender ){
	// 					const searchered_value = default_value.filter(v=>v.name_to_send.toLowerCase().includes(s_text.toLowerCase()) + v.name_sender.toLowerCase().includes(s_text.toLowerCase()));
	// 					set_value(value => [...searchered_value])
	// 					console.log('searcher 2')
	// 				}
	// 				else if( v.group_name ){
	// 					const searchered_value = default_value.filter(v=>v.group_name.toLowerCase().includes(s_text.toLowerCase()));
	// 					set_value([...searchered_value]);
	// 					if( searchered_value.length === 0 ){
	// 						set_value([]);
	// 						return_result(false)
	// 					}
	// 				}
	// 				else if( v.text ){
	// 					const searchered_value = default_value.filter(v=>v.text.toLowerCase().includes(s_text.toLowerCase()));
	// 					set_value([...searchered_value]);
	// 				}
	// 				else if( v.invite_data?.name_from ){
	// 					const searchered_value = default_value.filter(v=>v.invite_data?.name_from.toLowerCase().includes(s_text.toLowerCase()));
	// 					set_value([...searchered_value]);
	// 				}
	// 			})
	// 		}
	// 	}
	// 	else {
	// 		if( default_value ){
	// 			set_value(default_value)
	// 			if( return_result ){
	// 				return_result(true)
	// 			}
	// 		}
	// 	}
	// },[s_text])

	return (
		<div className='search'>
			<div className='row'>
				<div style={{
					width: '100%',
				}}>
					<Input 
						className={cl_i.default} 
						type="text" 
						placeholder="Поиск..." 
						value={s_text} 
						onChange={(e)=>{set_s_text(e.target.value)}}
					/>
				</div>
				<div>
					<Button> Найти </Button>
				</div>
			</div>
		</div>
	)
};

export default Searcher;