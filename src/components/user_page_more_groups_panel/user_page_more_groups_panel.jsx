import React, {useState, useEffect} from 'react';
import cl from './user_page_more_groups_panel.module.css';
import Searcher from '../../components/searcher/search.jsx';

export const User_Page_Move_Groups_Panel = ({groups, groups_profils_avatars, join_group, close, disable_scrolling_page, enable_scrolling_page}) => {

	const [ raw_groups, set_raw_groups ] = useState([]);
	const [ default_raw_groups, set_default_raw_groups ] = useState([]);
	const [ search, set_search ] = useState(false);

	useEffect(()=>{
		if( groups.length > 0 ){
			set_default_raw_groups(groups);
			set_raw_groups(groups);
		}
	},[groups])

	useEffect(()=>{
		disable_scrolling_page()
	},[])

	return (
		<div className={cl.user_page_more_groups_panel}>
			<div className={cl.fon} onClick={()=>{enable_scrolling_page(); close()}}></div>
			<div className={cl.groups_panel} onClick={(e)=>{e.stopPropagation()}}>
				<div className={cl.close_button} onClick={()=>{enable_scrolling_page(); close()}}>
					Закрыть
				</div>
				<div className={cl.panel}>
					<div className={cl.groups}>
						Группы
					</div>
					<Searcher
						value={raw_groups}
						default_value={default_raw_groups}
						set_value={set_raw_groups}
						return_result={set_search}
					>	
					</Searcher>
					{raw_groups.length > 0 &&
						raw_groups.map(g=>
						<div className='group-box' key={g._id} onClick={async () => {enable_scrolling_page(); await join_group(g._id)}}>
							<div className={cl.row}>
								<div className={cl.group_img}>
									<img className={cl.group_img_profil} src={groups_profils_avatars.find(o => o.name.toString() === g.group_img.toString())?.path} alt=""/>
								</div>
								<div className={cl.group_name}>
									{g.group_name}
								</div>
								<div className={cl.group_count_peoples}>
									{g.group_count ? g.group_count.length > 0 && g.group_count : '0'}
								</div>
							</div>
							<div className='group-type'>
								{g?.group_settings?.type_group === 'Закрытая' && '*'}
							</div>
						</div>								
					)
					}
				</div>
			</div>
		</div>
	)
};

export default User_Page_Move_Groups_Panel;