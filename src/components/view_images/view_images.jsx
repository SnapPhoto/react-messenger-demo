import React, {useState, useEffect, useRef} from 'react';
import cl from './view_images.module.css';
import $ from 'jquery';

export const View_Images = ({src, this_open, this_close, role, orientation}) => {
	const [visiable, set_visiable] = useState(false);
	const [main_down, set_main_down] = useState(false);

	// для ползунка
	const point = useRef(null);
	const line = useRef(null);
	const [point_size, set_point_size] = useState(null);
	const [line_size, set_line_size] = useState(null);
	const [down, set_down] = useState(false);
	const [this_resize, set_this_resize] = useState({});
	const [score, set_score] = useState(0);
	const [pos__down, set_pos__down] = useState({
		x: null,
		y: null,
	});
	const [save_pos__down, set_save_pos__down] = useState({
		x: null,
		y: null,
	})
	const [tik, set_tik] = useState(null);
	const [tik_range, set_tik_range] = useState(null);
	const [top_min, set_top_min] = useState(null);

	// для изображения
	const img_ref = useRef(null);
	const panel_ref = useRef(null);
	const [img_size, set_img_size] = useState({
		width: null,
		height: null,
	});
	const [panel_size, set_panel_size] = useState({
		width: null,
		height: null,
	});
	const [turn, set_turn] = useState('stop');
	const [panel_down, set_panel_down] = useState(false);
	const [current_pos_panel_down, set_current_pos_panel_down] = useState({
		x: null,
		y: null,
	});
	const [save_img_pos, set_save_img_pos] = useState({
		left: null,
		top: null,
	});
	const r_top = useRef(null);
	const r_left = useRef(null);

	useEffect(()=>{
		if( point.current !== null ){
			point.current.style.bottom = '';
			point.current.style.transform = 'translate(0px)';
			set_score(0);
			img_ref.current.style.left = '';
			img_ref.current.style.top = '';
			r_top.current = null;
			r_left.current = null;
		}
	},[])

	useEffect(()=>{
		if( !visiable ){
			set_turn('stop');
			r_top.current = null;
			r_left.current = null;
		}
	},[visiable])

	if( !visiable ){
		if( orientation === 'vertical'){
			if( point.current !== null ){
				point.current.style.transform = `translateY(0px)`;
			}
		}
		else if( orientation === 'horizontal'){
			if( point.current !== null ){
				point.current.style.transform = `translateX(0%)`;
			}
		};
	};

	useEffect(()=>{
		if( score && img_ref.current ){
			img_ref.current.style.left = `${(img_ref.current?.offsetLeft - 50) / 2}px`;
			img_ref.current.style.top = `${(img_ref.current?.offsetTop - 50) / 2 }px`;
			r_top.current = null;
			r_left.current = null;
		}
	},[score]);

	function close(){
		if( img_ref.current !== null && point.current !== null ){
			this_close('');
			set_visiable(false);
			set_score(0);
			img_ref.current.style.left = '';
			img_ref.current.style.top = '';
			point.current.style.bottom = '';
			point.current.style.transform = 'translate(0px)';
			r_top.current = null;
			r_left.current = null;
		}
		else{
			this_close('');
			set_visiable(false);
			set_score(0);
		}
	};

	useEffect(()=>{
		if( this_open ){
			set_visiable(true);
		}
	},[this_open]);


	useEffect(()=>{
		if( score !== null ){
			const i_size = img_ref.current.getBoundingClientRect();
			const p_size = panel_ref.current.getBoundingClientRect();
			img_ref.current.style.transform = `translate(0px, 0px)`;
			if( i_size !== null && p_size !== null ){
				if( i_size?.height > p_size?.height && i_size?.width < p_size?.width ){
					set_turn('vertical');
				}
				else if( i_size?.height < p_size?.height && i_size?.width > p_size?.width ){
					set_turn('horizontal');
				}
				else if( i_size?.height > p_size?.height && i_size?.width > p_size?.width ){
					set_turn('all');
				}
				else if( i_size?.height < p_size?.height && i_size?.width < p_size?.width ){
					set_turn('stop');
				}
			}
		}
	},[score]);


	// ползунок
	function handler_resize(e){
		set_this_resize({
			width: window.offsetWidth,
			height: window.offsetHeight,
		});
		close();
	};
	function handler_down(e){
		set_down(true);
		set_pos__down({
			x: e.clientX,
			y: e.clientY,
		})
		set_pos__down({
			x: point.current?.getBoundingClientRect()?.left,
			y: point.current?.getBoundingClientRect()?.top,
		});
	};
	function handler_up(e){
		set_down(false);
		set_pos__down({
			x: null,
			y: null,
		})
		set_pos__down({
			x: point.current?.getBoundingClientRect()?.left,
			y: point.current?.getBoundingClientRect()?.top,
		});
	};
	function handler_move(e){
		if( top_min !== null && pos__down?.y !== null && down && main_down && tik_range !== null ){
			point.current.style.transform = `translateY(${Math.min(top_min?.low, (point_size?.top + point_size?.height / 2 - e.clientY)*-1, Math.max(top_min?.top))}px)`;
			tik_range.map(r => {
				if( point.current.getBoundingClientRect()?.top < r?.value ){
					set_score(r?.index > 0 ? r?.index + 1 : 1)
				};
			});
		};
	};
	function handler_main_down(e){
		set_main_down(false);
	};
	function handler_main_up(e){
		set_main_down(true);
	};
	useEffect(()=>{
		if( line.current !== null && point.current !== null ){
			const l_size = line.current.getBoundingClientRect();
			const p_size = point.current.getBoundingClientRect();
			set_point_size(p_size);
			set_line_size(l_size);
			// console.clear()
			const tik = l_size?.height / 100;
			const range = (tik, range_top_min) => {
				let r = [];
				console.log(tik)
				for( let i = 1, index = -8; index < 100 && i < l_size?.height; i+=tik-tik/10, index ++){
					const rr = {
						tik: tik,
						index: index,
						value: l_size?.top + l_size?.height - i,
					}
					r.push(rr);
				};
				if( r ){
					return r;
				}
				else {
					return false;
				};
			};
			const range_top_min = {
				top: l_size?.top + p_size?.height,
				low: l_size?.top - p_size?.height + l_size?.height,
			};
			if( range_top_min ){
				set_top_min(range_top_min);
			};
			const data_range = range(tik, range_top_min) || null;
			if( data_range !== null ){
				set_tik(tik);
				set_tik_range(data_range);
				console.log('tik = ', tik);
				console.log('range = ', range(tik, l_size));
				console.log('top max position = ', range_top_min?.top);
				console.log('top min position = ', range_top_min?.low);
			};
		}
	},[line, point, visiable, this_resize]);


	// изображение
	function handler_panel_down(e){
		if( img_ref.current !== null && panel_ref.current !== null ){
			set_panel_down(true);
			set_current_pos_panel_down({
				x: e.offsetX,
				y: e.offsetY,
			});
			const i_left = img_ref.current.offsetLeft;
			const i_top = img_ref.current.offsetTop;
			const l = img_ref.current.getBoundingClientRect()?.left;
			const t = img_ref.current.getBoundingClientRect()?.top;
			set_save_img_pos({
				top: i_top,
				left: i_left,
				l: l,
				t: t,
			});
			let img_size = img_ref.current.getBoundingClientRect();
			set_img_size({
				width: img_size?.width,
				height: img_size?.height,
				left: img_size?.left,
				top: img_size?.top,
			});
			let panel_size = panel_ref.current.getBoundingClientRect();
			set_panel_size({
				width: panel_size?.width,
				height: panel_size?.height,
				left: panel_size?.left,
				top: panel_size?.top,
			});
		};
	};
	function handler_panel_up(e){
		if( img_ref.current !== null && panel_ref.current !== null ){
			set_panel_down(false);
			const i_left = img_ref.current.offsetLeft;
			const i_top = img_ref.current.offsetTop;
			const l = img_ref.current.getBoundingClientRect()?.left;
			const t = img_ref.current.getBoundingClientRect()?.top;
			set_save_img_pos({
				top: i_top,
				left: i_left,
				l: l,
				t: t,
			});
		}
	};
	function handler_panel_move(e){
		if( panel_down && img_ref.current !== null && panel_ref.current !== null && save_img_pos?.left !== null && current_pos_panel_down?.x && img_size?.width !== null && panel_size?.width !== null && score > 0 ){
			const p_size = panel_ref.current.getBoundingClientRect();
			const i_size = img_ref.current.getBoundingClientRect();
			set_panel_size({
				width: p_size?.width,
				height: p_size?.height,
				left: p_size?.left,
				top: p_size?.top,
			});
			set_img_size({
				width: i_size?.width,
				height: i_size?.height,
				left: i_size?.left,
				top: i_size?.top,
			});
			if( turn === 'horizontal' ){
				let min_l = p_size?.left + p_size?.width - i_size?.width - r_left.current; 
				let max_l = p_size?.left - r_left.current;
				let current_left = img_ref.current.getBoundingClientRect()?.left;
				let current_x = save_img_pos?.left - 50 - current_pos_panel_down?.x + e.offsetX;
				if(r_left.current === null ){
					r_left.current = (current_x - current_left)*-1;
				};
				img_ref.current.style.left = `${Math.max(min_l, Math.min(current_x, max_l))}px`;
			}
			else if( turn === 'vertical' ){
				let min_t = p_size?.top + p_size?.height - i_size?.height - r_top.current; 
				let max_t = p_size?.top - r_top.current;
				let current_top = img_ref.current.getBoundingClientRect()?.top;
				let current_y = save_img_pos?.top - 50 - current_pos_panel_down?.y + e.offsetY;
				if(r_top.current === null ){
					r_top.current = (current_y - current_top)*-1;
				};
				img_ref.current.style.top = `${Math.max(min_t, Math.min(current_y, max_t))}px`;
			}
			else if( turn === 'all' ){
				let min_l = p_size?.left + p_size?.width - i_size?.width - r_left.current; 
				let max_l = p_size?.left - r_left.current;
				let current_left = img_ref.current.getBoundingClientRect()?.left;
				let current_x = save_img_pos?.left - 50 - current_pos_panel_down?.x + e.offsetX;

				let min_t = p_size?.top + p_size?.height - i_size?.height - r_top.current; 
				let max_t = p_size?.top - r_top.current;
				let current_top = img_ref.current.getBoundingClientRect()?.top;
				let current_y = save_img_pos?.top - 50 - current_pos_panel_down?.y + e.offsetY;

				if(r_left.current === null ){
					r_left.current = (current_x - current_left)*-1;
				};
				if(r_top.current === null ){
					r_top.current = (current_y - current_top)*-1;
				};
				// console.clear();
				// console.log('min_l = ', min_l);
				// console.log('current_left = ', current_left);
				// console.log('current_x = ', current_x);
				// console.log('r_left.current = ', r_left.current)
				// console.log('max_l = ', max_l);
				// console.log('');
				// console.log('min_t = ', min_t);
				// console.log('current_top = ', current_top);
				// console.log('current_y = ', current_y);
				// console.log('r_top.current = ', r_top.current)
				// console.log('max_t = ', max_t);
				img_ref.current.style.left = `${Math.max(min_l, Math.min(current_x, max_l))}px`;
				img_ref.current.style.top = `${Math.max(min_t, Math.min(current_y, max_t))}px`;
			}
		}
	};
	useEffect(()=>{
		if( line.current !== null && point.current !== null && top_min && img_ref.curren !== null && panel_ref.current !== null ){
			// ползунок
			$(line.current).off();
			$(window).off();
			$(document).off();


			$(line.current).on('mousedown', {}, handler_down);
			$(line.current).on('mouseup', {}, handler_up);
			$(line.current).on('mousemove', {}, handler_move);
			$(window).on('resize', {}, handler_resize);
			$(document).on('mousedown', {}, handler_main_down);
			$(document).on('mouseup', {}, handler_main_up);

			$(panel_ref.current).on('mousedown', handler_panel_down);
			$(panel_ref.current).on('mouseup', handler_panel_up);
			$(panel_ref.current).on('mousemove', handler_panel_move);

			return ()=>{
				if( line.current !== null && point.current !== null && top_min && img_ref.current !== null && panel_ref.current !== null ){
					$(line.current).off();
					$(window).off();
					$(document).off();
					$(panel_ref.current).off();
				};
			};
		}
	},[point, line, this_resize, tik, tik_range, top_min, pos__down, img_ref, panel_ref, panel_down, save_img_pos, current_pos_panel_down, img_size, panel_size, r_left, r_top]);

	return (
		<div className={visiable === true ? cl.view_images_open : cl.view_images_close}>
			<div className={cl.view_images_img_box} onClick={(e)=>{e.stopPropagation()}}>
				<div ref={panel_ref} className={cl.view_images_panel_for_move_img}>
					{/* панель перемещения */}
				</div>
				{role !== undefined &&
					<div ref={orientation === 'vertical' ? line : orientation === 'horizontal' && line} className={orientation === 'vertical' ? cl.view_images_zoom_vertical : orientation === 'horizontal' && cl.view_images_zoom_horizontal} style={{pointerEvents: panel_down? 'none' : '', opacity: panel_down? '0' : '1'}}>
						<div className={cl.score}>
							{score !== null && score}
						</div>
						<div className={orientation === 'vertical' ? cl.view_images_zoom_bar_vertical : orientation === 'horizontal' && cl.view_images_zoom_bar_horizontal}>
							{/* тонкая полоска */}
						</div>
						<div ref={orientation === 'vertical' ? point : orientation === 'horizontal' && point} className={orientation === 'vertical' ? cl.view_images_zoom_volume_vertical : orientation === 'horizontal' && cl.view_images_zoom_volume_horizontal}>
							 {/* деталь управления зумом */}
						</div>
					</div>
				}
				<img ref={img_ref} className={cl.view_images_img} src={src ? src : null} style={{scale: visiable ? `${score > 1 ? 1+score/10 : 1}` : `1`}} onClick={(e)=>{e.stopPropagation()}}/>
			</div>
			<div className={cl.view_images_fon} onClick={()=>{close()}}>
				{/* фон */}
			</div>
		</div>
	)
};

export default View_Images;