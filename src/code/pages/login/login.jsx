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
	const auto_login_started = useRef(false);
	const navigate = useNavigate();

	useEffect(()=>{
		const auto_pass = user_reg_data?.pass;
		const auto_email = user_reg_data?.email;
		if( auto_login && auto_email && auto_pass && !auto_login_started.current ){
			auto_login_started.current = true;
			set_pass(auto_pass);
			set_email(auto_email);
			log_in(null, {pass: auto_pass, email: auto_email});
		}
	},[user_reg_data, auto_login]);

	async function log_in(e, credentials = {}){
		e?.preventDefault();
		const login_pass = credentials.pass ?? pass;
		const login_email = credentials.email ?? email;
		try{
			const res = await axios.post('http://localhost:8080/account/login', {}, {
				headers: {
					pass: login_pass,
					email: login_email,
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