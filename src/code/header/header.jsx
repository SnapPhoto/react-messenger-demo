import React, { useState, useEffect , useRef } from 'react';
import { Link } from 'react-router-dom';
import '../../App.css';
import Button_Default from '../../components/buttons/button_default/button_default';
import Profil_Icon from '../../components/profil/profil_icon/profil_icon';

export const Header = ({token, account_panel_active, set_account_panel_active, avatar}) => {

	return (
		<div className='header'>
			<Link
				to="/main"
				style={{
					width: 'auto',
					height: '60px',
				}}
			>
				<Button_Default>Главная</Button_Default>
			</Link>
			{!token
			?
				<Link
					to="/account/login"
					style={{
						width: 'auto',
						height: '60px',
					}}
				>
					<Button_Default>Войти</Button_Default>
				</Link>
			:
				account_panel_active === false
				?
					<Profil_Icon set_account_panel_active={set_account_panel_active} avatar={avatar}></Profil_Icon> 
				:
					null
			}
		</div>
	)
};

export default Header;