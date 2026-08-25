import React, { useState, useEffect, useRef	} from 'react';
import cl from './profil_icon.module.css';

export const profil_icon = ({set_account_panel_active, avatar}) => {
	return (
		<div className={cl.default} onClick={()=>{set_account_panel_active(true)}}>
			{avatar
			?	
				<div className='profil-icon-avatar'>
					<img src={avatar}/>
				</div>
				
			: 
				<div>IMG</div>
			}
		</div>
	)
};

export default profil_icon;