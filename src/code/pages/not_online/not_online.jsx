import React from 'react';
import { Link } from 'react-router-dom';

export const Not_Online = () => {
	return (
		<div className='not-found'>
			<div>
				Хм... Проблемы с интернетом?
			</div>
			<div>
				<Link to='/main'>Вернуться на главную</Link>
			</div>
		</div>
	)
};

export default Not_Online;