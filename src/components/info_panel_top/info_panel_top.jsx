import React, {useState, useEffect, useRef} from 'react';
import cl from './info_panel_top.module.css';

export const Info_Panel_Top = (props) => {

	return (
		<div className={props.className}>
			<div>
				удаление через
			</div>
			<div>
				{props.time_count > 0 && props.time_count}
			</div>
			<div onClick={props.cancel} className={cl.button}>
				отменить
			</div>
		</div>
	)
};

export default Info_Panel_Top;