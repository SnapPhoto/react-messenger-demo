import React, {useState, useEffect} from 'react';
import cl from './panel_with_hidden_posts_for_group.module.css';
import Content_Block from '../../components/content/content.jsx';

export const Panel_With_Hidden_Posts_For_Group = ({close, posts, group_id, posts_images, get_posts, this_my_group, set_visiable_view_for_images, set_current_img_for_view, new_images_array, hidden_images}) => {
	
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
					{posts.length > 0 && posts.some(p=>p.hide === 'true')
						?
							posts.slice().reverse().map((post, index) =>
								post.hide === 'true' &&
									<div key={index} className={cl.block}>
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
													group_id={group_id}
													// user_id={user_id}
													refresh_posts={get_posts}
													date={post?.date}
													changed={post?.changed}
													hidden={post?.hide}
													this_my_group={this_my_group}
													set_visiable_view_for_images={()=>{set_visiable_view_for_images(true)}}
													set_current_img_for_view={set_current_img_for_view}
													new_images_array={new_images_array}
													hidden_images={hidden_images}
													type_view={'hidden'}
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

export default Panel_With_Hidden_Posts_For_Group;