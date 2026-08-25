import React from 'react';
import { Link } from 'react-router-dom';

export const Not_Found = () => {
	return (
		<div className='not-found'>
			<div>
				Страница не найдена
			</div>
			<div>
				<Link to='/main'>Вернуться на главную</Link>
			</div>
		</div>
	)
};

export default Not_Found;