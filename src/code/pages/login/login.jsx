import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../../App.css';
import cl from './login.module.css';
import Input_Default from '../../../components/inputs/input_default/input_default.jsx';
import Button_Default from '../../../components/buttons/button_default/button_default.jsx';
import axios from 'axios';

export const Login = ({set_token, auto_login, user_reg_data, set_user_reg_data, set_my_id}) => {
	const [pass, set_pass] = useState('');
	const [email, set_email] = useState('');
	const navigate = useNavigate();

	useEffect(()=>{
		if( user_reg_data && auto_login ){
			const auto_pass = user_reg_data.pass;
			const auto_email = user_reg_data.email;
			if( auto_email && auto_pass ){
				set_pass(auto_pass);
				set_email(auto_email)
				const await_auto_login = document.querySelector('[auto_login]');
				if( await_auto_login ){
					await_auto_login.click();
				}
			};
		}
	},[user_reg_data]);

	async function log_in(e){
		e.preventDefault();
		try{
			const res = await axios.post('http://localhost:8080/account/login', {}, {
				headers: {
					pass,
					email,
				}
			});
			if( res.data?.login ){
				const token = res.data?.token;
				if( !token ){
					console.error('Токен передался с ошибкой');
				};
				localStorage.setItem('token', token);
				set_token(token);
				set_pass('');
				set_email('');
				set_user_reg_data({});
				console.log('login_my_id = ', res?.data?.my_id)
				navigate('/main');
			}
		}
		catch(err){
			console.error('Ошибка авторизации: ', err);
		}
	};

	return (
		<div className={cl.login_default}>
			<form className='form-login' action="" onSubmit={(e)=>{log_in(e)}}>
				<div style={{margin: '0 0 20px 0'}}>
					Войдите
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
					<Button_Default
						auto_login='await'
					>Войти
					</Button_Default>
				</div>
				<div className='form-line'>
					<Link
						to="/account/register"
					>
						<Button_Default
						>Зарегистрироваться
						</Button_Default>
					</Link>
				</div>
			</form>
		</div>
	)
};

export default Login;