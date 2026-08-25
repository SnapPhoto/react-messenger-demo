import React, {useState, useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';

export const Logout = ({token, set_token, set_account_panel_active}) => {

	const [errors, set_errors] = useState([]);

	const navigate = useNavigate();

	useEffect(()=>{
		async function log_out(){
			if( !token ){
				return;
			}
			// код выхода
			try{
				const response = await axios.post("http://localhost:8080/account/logout", {}, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});
				if(response.data?.message === 'logout' ){
					localStorage.removeItem('token');
					set_token(null);
					set_account_panel_active(false);
					navigate("/account/login");
				}
				else{ 
					console.error('Нет ответа от сервера')
				}
			}
			catch(err){
				set_errors(errs => [...errs, err]);
			}
		};
		log_out();
	},[token]);

	return (
		<div>
			<div>
				Logout
			</div>
			{errors.length > 0
			? 
				<div>
					{errors.map((err, index)=>
						<div key={index}>
							{err.err}
						</div>
					)}
				</div>
			:
				null
			}
		</div>
	)
};

export default Logout;