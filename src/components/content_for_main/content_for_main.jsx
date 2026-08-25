import React, {useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import cl from './content_for_main.module.css';

export const Content_For_Main = ({}) => {
	return (
		<div className={cl.content}>
			content	
		</div>
	)
};

export default Content_For_Main;