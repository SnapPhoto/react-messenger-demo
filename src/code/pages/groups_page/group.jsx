import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../../../App.css';
import App_Router from '../../../app_router/app_router';
import { BrowserRouter } from 'react-router-dom';
import Searcher from '../../../components/searcher/search';
 
export const Group = ({data}) => { //хрень бесполезная. нигде не исползуется
	return (
		<div className='groups'>
			<div className='panel-header'>
				<div className='panel-header-item'>
					item 1
				</div>
				<div className='panel-header-item'>
					item 2
				</div>
				<div className='panel-header-item'>
					item 3
				</div>
				<div className='panel-header-item'>
					item 4
				</div>
			</div>
			<div className='row'>
				<div className='col-2'>
					<div className='blocks' style={{display: 'block'}}>
						<div className='block-item' style={{textAlign: 'left', padding: '2px', boxSizing: 'border-box'}}>
							<Link className='link' to='/main/peoples'> Люди </Link>
							<Link className='link' to='/main/friends'> Друзья </Link>
							<Link className='link' to='/account/mail'> Сообщения </Link>
							<Link className='link' to='/main/groups'> Группы </Link>
						</div>
					</div>
				</div>
				<div className='split'>
					{/* разделение */}
				</div>
				<div className='col-8'>
					{/* список групп */}
					<div className='blocks'>
						<div className='block-item'>
							поисковая строка
						</div>
					</div>
					<div className='blocks'>
						<div className='block-item'>
							<div className='row'>
								<div className='group-img'>
									IMG
								</div>
								<div className='group-name'>
									Название
								</div>
								<div className='group-count-peoples'>
									0 п
								</div>
							</div>
						</div>
					</div>
				</div>
					
			</div>
		</div>
	)
};

export default Group;