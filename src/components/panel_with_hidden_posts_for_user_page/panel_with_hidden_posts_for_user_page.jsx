import React, {useEffect} from 'react';
import cl from './panel_with_hidden_posts_for_user_page.module.css';
import Content_Block from '../../components/content/content.jsx';

export const Panel_With_Hidden_Posts_For_User_Page = ({close, posts, user_id, posts_images, get_posts, this_my_page, hidden_images, new_images_array, set_current_img_for_view, set_visiable_view_for_images}) => {
	
	const hidden_posts = (Array.isArray(posts) ? posts : []).filter(post => post?.hide === true || post?.hide === 'true');

	useEffect(()=>{
		document.body.style.height = '100vh';
		document.body.style.overflow = 'hidden';
	},[]);

	function close_this(){
		document.body.style.overflow = '';
		close();
	}

	return (
		<div className={cl.panel_with_hidden_posts_for_user_page} onClick={()=>{close_this()}}>
			<div className={cl.form} onClick={(e)=>{e.stopPropagation()}}>
				<div className={cl.button_close} onClick={()=>{close_this()}}>
					Закрыть
				</div>
				<div className={cl.posts}>
					{hidden_posts.length > 0
						?
							hidden_posts.slice().reverse().map(post =>
								<div key={post._id} className={cl.block}>
										<div className='blocks'>
											<div className='block-item'>
												<Content_Block
													// types: [img],[text],[img_and_text]
													type={post?.type_post} 
													role={'admin'}
													img={post?.images}
													text={post?.text}
													visiable={true}
													posts_images={posts_images}
													id={post?._id}
													group_id={undefined}
													user_id={user_id}
													refresh_posts={get_posts}
													date={post?.date}
													changed={post?.changed}
													hidden={post?.hide}
													this_my_page={this_my_page}
													this_user_page={true}
													new_images_array={new_images_array}
													hidden_images={hidden_images}
													type_view={'hidden'}
													set_current_img_for_view={set_current_img_for_view}
													set_visiable_view_for_images={()=>{set_visiable_view_for_images(true)}}
												></Content_Block>
											</div>
										</div>
									</div>
							)
						:
							<div>
								Пусто
							</div>
					}
				</div>
			</div>
		</div>
	)
};

export default Panel_With_Hidden_Posts_For_User_Page;