import React, {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import cl from './user_page_more_friends_panel.module.css';
import Searcher from '../../components/searcher/search.jsx';

export const User_Page_Move_Friends_Panel = ({friends, avatars, close, disable_scrolling_page, set_current_user}) => {
	const navigate = useNavigate();

	const [ raw_friends, set_raw_friends ] = useState([]);
	const [ default_raw_friends, set_default_raw_friends ] = useState([]);

	useEffect(()=>{
		if( friends.length > 0 ){
			set_default_raw_friends(friends);
			set_raw_friends(friends);
		}
	},[friends])

	useEffect(()=>{
		disable_scrolling_page()
	},[]);

	function close_this(){
		document.body.style.overflow = '';
		close();
	}

	return (
		<div className={cl.user_page_more_friends_panel}>
			<div className={cl.fon} onClick={()=>{close_this()}}></div>
			<div className={cl.panel}>
				<div className={cl.close_button} onClick={()=>{close_this()}}>
					Закрыть
				</div>
				<div className={cl.panel_friends}>
					<div className={cl.friends}>
						Друзья
					</div>
					<Searcher
						value={raw_friends}
						default_value={default_raw_friends}
						set_value={set_raw_friends}
					>	
					</Searcher>
					{raw_friends.map((friend, index) =>
					<div className='people' key={index}>
						<div className='people-data'>
							<div className='row'>
								<div>
									{friend.avatar 
									?
										<div onClick={()=>{document.body.style.overflow = ''; set_current_user(friend); navigate(`/main/${friend ? friend.id : 'user_undefined'}/page`)}} className='people-icon-true'>
											<img className="icon"src={avatars.find(a=>a.name === friend.avatar)?.path}/>
										</div>
									:
										<div onClick={()=>{document.body.style.overflow = ''; set_current_user(friend)}} className='people-icon-false'>
											
										</div>
									}
								</div>
								<div className='people-name' onClick={()=>{document.body.style.overflow = ''; set_current_user(friend)}}>
									{friend.name}
								</div>
							</div>
						</div>
					</div>
				)}
				</div>
			</div>
		</div>
	)
};

export default User_Page_Move_Friends_Panel;