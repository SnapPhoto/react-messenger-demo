import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate} from 'react-router-dom';
import '../../../App.css';
import cl from './register.module.css';
import Input_Default from '../../../components/inputs/input_default/input_default.jsx';
import Button_Default from '../../../components/buttons/button_default/button_default.jsx';
import axios from 'axios';

export const Register = ({set_auto_login, set_user_reg_data, set_my_id}) => {

	const [name, set_name] = useState('');
	const [pass, set_pass] = useState('');
	const [email, set_email] = useState('');
	const [dbl_pass, set_dbl_pass] = useState('');
	const [errors, set_errors] = useState([]);
	const [ entered_verify_code, set_entered_verify_code ] = useState('');
	const [ sended_code_on_email, set_sended_code_on_email ] = useState(false);
	const [ sucsess_code, set_sucsess_code ] = useState(false);
	const [ notifications, set_notifications ] = useState([]);
	const registration_in_progress = useRef(false);
	const code_check_in_progress = useRef(false);

	const navigate = useNavigate();

	async function register_account(e){
		e?.preventDefault();
		if( registration_in_progress.current ) return;
		registration_in_progress.current = true;
		try{
			set_errors([]);
			const new_errors = [];
			//проверка данных
			if( name.trim() === '' || name.length === 0 ){
				new_errors.push({error: 'Имя не указано'});
			}
			if( pass.trim() === '' || pass.length === 0 ){
				new_errors.push({error: 'Пароль не указан'});
			}
			if( dbl_pass.trim() === '' || dbl_pass.length === 0 ){
				new_errors.push({error: 'Проверочный пароль не указан'})
			}
			if( !email ){
				new_errors.push({error: 'Email не указан'});
			}
			if( pass !== dbl_pass ){
				new_errors.push({error: 'Пароли не совпадают'});
			}
			if( !name && !pass && !dbl_pass && !email ){
				new_errors.push({error: 'Заполните форму регистрации'});
			}
			const response = await axios.post('http://localhost:8080/account/register', {}, {
				headers: {
					name,
					email,
					pass,
					dbl_pass,
				}
			});
			set_errors(new_errors);
			// if( response.data?.error ){
			// 	console.error('Сервер: ', response.data?.error)
			// };
			if( response.data?.register ){
				set_user_reg_data({
					pass,
					email,
				})
				set_auto_login(true);
				set_my_id(response?.data?.my_id);
				navigate('/account/login');
			};
		}

		catch(err){
			console.error('Ошибка регистрации: ', err);
		}
		finally{
			registration_in_progress.current = false;
		}
	};

	useEffect(()=>{
		if( errors.length > 0 ){
			errors.forEach((item)=>{
				console.error(item.error);
			})
		}
	},[errors]);

	async function send_veryfy_code(){
		if( name && email && pass && dbl_pass ){
			try{
				const response = await axios.post('http://localhost:8080/send/verify_code', {
					send_to: email,
				},{});
				if( response?.data?.message ){
					console.log('Ответ от сервера: ', response?.data?.message);
				};
				if( response?.data?.send_code ){
					console.log('Код отправлен? ', response?.data?.send_code);
					set_sended_code_on_email(response?.data?.send_code);
				};
			}
			catch(err){
				console.error('Ошибка отправки проверочного кода: ', err);
			}
		};
	};

	async function check_verify_code(){
		if( code_check_in_progress.current || registration_in_progress.current ) return;
		code_check_in_progress.current = true;
		try{
			const response = await axios.post('http://localhost:8080/get_verify_code', {
				email: email,
				entered_code: entered_verify_code,
			}, {});
			if( response?.data?.message ){
				console.log('Сервер вернул сообщение: ', response?.data?.message);
			};
			if( response?.data?.code ){
				console.log('Код верный!');
				await register_account();
			}
			else{
				set_entered_verify_code('');
				set_notifications(notifications => [...notifications, 'Код не верный!'])
			}
		}
		catch(err){
			console.error('Ошибка получения проверочного кода: ', err);
		}
		finally{
			code_check_in_progress.current = false;
		}
	};

	async function clear_codes(){
		try{
			const response = await axios.post('http://localhost:8080/remove_codes', {}, {});
			if( response?.data?.message ){
				console.log(response?.data?.message);
			};
		}
		catch(err){
			console.error('Ошибка очистки кодов: ', err);
		}
	};

	useEffect(()=>{
		if( entered_verify_code !== null && entered_verify_code.trim().length > 0 && entered_verify_code.trim() !== '' ){
			if( notifications.length > 0 ){
				set_notifications([]);
			};
			if( entered_verify_code.trim().length === 4 ){
				check_verify_code();
			}
		};
	},[entered_verify_code])

// 	async function delete_all_users(){
// 		await axios.post('http://localhost:8080/remove_all_users');
// 	}
// 
// 	useEffect(()=>{
// 		delete_all_users()
// 	},[])

	return (
		<div className={cl.register_default}>
			<form action="" onSubmit={(e)=>{e.stopPropagation()}}>
				<div style={{margin: '0 0 20px 0'}}>
					Зарегистрируйтесь
				</div>
				<div className='form-line'>
					<Input_Default
						placeholder='Имя'
						value={name}
						onChange={(e)=>{set_name(e.target.value)}}
					></Input_Default>
				</div>
				<div className='form-line'>
					<Input_Default
						placeholder='Email'
						value={email}
						onChange={(e)=>{set_email(e.target.value)}}
					></Input_Default>
				</div>
				<div className='form-line'>
					<Input_Default
						placeholder='Пароль'
						value={pass}
						onChange={(e)=>{set_pass(e.target.value)}}
					></Input_Default>
				</div>
				<div className='form-line'>
					<Input_Default
						placeholder='Повторите пароль'
						value={dbl_pass}
						onChange={(e)=>{set_dbl_pass(e.target.value)}}
					></Input_Default>
				</div>
				{!sended_code_on_email
				?
					<div className='form-line'>
						<Button_Default 
							type='button'
							onClick={(e)=>{e.stopPropagation(); send_veryfy_code()}}
						>
							Зарегистрироваться
						</Button_Default>
					</div>
				:
					<div>
						<div>
							<span>На указанную почту отправлен под подтверждения</span>
						</div>
						<div className='form-line'>
							<Input_Default
								placeholder='Введите проверочный код'
								value={entered_verify_code}
								onChange={(e)=>{set_entered_verify_code(e.target.value)}}
							></Input_Default>
						</div>
						{notifications.length > 0 &&
							<div>
								{notifications.forEach((notification)=>
									<span>{notification}</span>
								)}
							</div>
						}
						<div className='form-line'>
							<Button_Default
								type='button'
								onClick={(e)=>{e.stopPropagation(); check_verify_code()}}
							>
								Проверить код
							</Button_Default>
						</div>
						<div className='form-line'>
							<Button_Default
								type='button'
								onClick={(e)=>{e.stopPropagation(); send_veryfy_code()}}
							>
								Отправить новый код
							</Button_Default>
						</div>
					</div>
				}
				<div className='form-line'>
					<Link to="/account/login">
						<Button_Default
						>Уже есть аккаунт
						</Button_Default>
					</Link>
				</div>
				{/* <div className='form-line'> */}
				{/* 	<Button_Default  */}
				{/* 		type='button' */}
				{/* 		onClick={(e)=>{e.stopPropagation(); send_veryfy_code()}} */}
				{/* 	> */}
				{/* 		Отправить проверочный код */}
				{/* 	</Button_Default> */}
				{/* </div> */}
				{/* {sended_code_on_email && */}
				{/* 	<div className='form-line'> */}
				{/* 		<Input_Default */}
				{/* 			placeholder='Введите проверочный код' */}
				{/* 			value={entered_verify_code} */}
				{/* 			onChange={(e)=>{set_entered_verify_code(e.target.value)}} */}
				{/* 		></Input_Default> */}
				{/* 	</div> */}
				{/* } */}
				{/* {sended_code_on_email && */}
				{/* 	<div className='form-line'> */}
				{/* 		<Button_Default */}
				{/* 			type='button' */}
				{/* 			onClick={(e)=>{e.stopPropagation(); check_verify_code()}} */}
				{/* 		> */}
				{/* 			Проверить код */}
				{/* 		</Button_Default> */}
				{/* 	</div> */}
				{/* } */}
				{/* <div className='form-line'> */}
				{/* 	<Button_Default */}
				{/* 		type='button' */}
				{/* 		onClick={(e)=>{e.stopPropagation(); clear_codes()}} */}
				{/* 	> */}
				{/* 		Очистить хранилище с кодами */}
				{/* 	</Button_Default> */}
				{/* </div> */}
				{/* КОД ПРОХОДИТ ПРОВЕРКУ!!! НУЖНО НАСТРОИТЬ ИНТЕРФЕЙС!!! */}
			</form>
		</div>
	)
};

export default Register;