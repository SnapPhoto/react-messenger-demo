import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { BrowserRouter } from 'react-router-dom';
import App_Router from './app_router/app_router';
import Header from './code/header/header';
import Bottom from './code/bottom/bottom';
import Account_Panel from './code/account_panel/account_panel.jsx';
import axios from 'axios';

function App(){

  const [auto_login, set_auto_login] = useState(false);
  const [user_reg_data, set_user_reg_data] = useState({});
  const [token, set_token] = useState(null);
  const [account_panel_active, set_account_panel_active] = useState(false);
  const [online, set_online] = useState(true);
  const [my_data, set_my_data] = useState({});
  const my_id_ref = useRef(null);
  const [selected_avatar, set_selected_avatar] = useState(null);
  const [my_avatar, set_my_avatar] = useState(null);
  const [avatar, set_avatar] = useState('');

  const [log_in, set_log_in] = useState(false);

  const [refresh_data, set_refresh_data] = useState(true);

  const [timer, set_timer] = useState(null);

  // видимость панели Приглашений/Уведомлений
  const [ visiable_panel_with_invites, set_visiable_panel_with_invites ] = useState(false);

  // видимость панели с отправкой приглашения вступить в группу
  const [ visiable_panel_with_push_user_in_group, set_visiable_panel_with_push_user_in_group ] = useState(false);

  // websocket
  const ws_ref = useRef(null)
  const [ ws_message_type, set_ws_message_type ] = useState(null)

  useEffect(()=>{
    set_visiable_panel_with_push_user_in_group(false);
    set_visiable_panel_with_invites(false);
  },[])

  useEffect(()=>{
    if( !token ){ return; }
    try{
      const ws = new WebSocket('ws://localhost:8080/ws');
      if( ws ){
        if( ws_ref.current === null ){
          ws_ref.current = ws;
        };
        ws.onopen = () => {
          console.log('[ws] Подключен к websocket');
        };

        ws.onmessage = (event) => {
          set_ws_message_type(null)
          const raw_data = event?.data;
          // console.log('[ws] raw_data = ', raw_data)
          let parsed_data = null;
          try{
            const parsed = JSON.parse(raw_data);
            parsed_data = parsed;
          }
          catch(err){
            console.log('[ws] При парсинге сообщения вышла ошибка: ', err, '| Raw data = ', raw_data);
            parsed_data = raw_data;
          }
          console.log('[ws] Получено сообщение: ', parsed_data)
          if( parsed_data?.type === 'new_post_user_page' ){
            // когда пользователь отправляет новый пост на своей странице
            // он посылает через websocket сообщение с {type: ...}
            // и когда другие подключённые клиенты получают сообщение от websocket
            // с указанным {type: ...}, то выполняем ...
            set_ws_message_type(parsed_data?.type)
          };
          if( (parsed_data?.type === 'add_friend') || (parsed_data?.type === 'remove_friend') || (parsed_data?.type === 'cancel_add_friend') || (parsed_data?.type === 'confirm_friend') || (parsed_data?.type === 'cancel_confirm_friend') ){
            if( parsed_data?.for === my_id_ref.current || parsed_data?.from === my_id_ref.current ){
              set_ws_message_type(parsed_data)
            }
          };
          if( (parsed_data?.type === 'new_post_message') || (parsed_data?.type === 'message') || (parsed_data?.type === 'remove_message') || (parsed_data?.type === 'change_message') ){
            set_ws_message_type(parsed_data)
          };
          if( (parsed_data?.type === 'change_content_for_group') || (parsed_data?.type === 'change_content_for_mail') || (parsed_data?.type === 'change_status_for_mail') ){
            set_ws_message_type(parsed_data)
          };
          if( (parsed_data?.type === 'join_in_group') || (parsed_data?.type === 'leave_from_group') ){
            set_ws_message_type(parsed_data)
          };
          if( (parsed_data?.type === 'remove_content_for_group') || (parsed_data?.type === 'join_in_group') ){
            set_ws_message_type(parsed_data)
          };
          if( parsed_data?.type === 'new_post_group' ){
            set_ws_message_type(parsed_data)
          }
          if( parsed_data?.type === 'invite_in_group' && parsed_data?.for_user === my_id_ref.current ){
            set_ws_message_type(parsed_data)
          };
        };
        ws.onclose = () => {
          console.log('[ws] Соединение с websocket закрыто!');
        };
        ws.onerror = (err) => {
          console.log('[ws] Ошибка: ', err);
        };
      }
      else{
        console.error('[ws] Не удалось подключиться к websocket');
      }
    }
    catch(err){
      console.log('Ошибка: ', err);
    }
    return () => {
      if( ws_ref.current !== null ){
        ws_ref.current = null
      }
    };
  },[token])

  async function change_status_online(status){
    console.log('change_status_online')

    if( !token ){
      return;
    };
    const response = await axios.post('http://localhost:8080/change_status_online', {
      status: status,
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  }

  useEffect(()=>{
    if( ws_ref.current !== null && ws_ref.current?.readyState === 1 ){
      // смена статуса на [В сети]
      change_status_online('y')
    }
    if( ws_ref.current?.readyState === 0 ){
      // смена статуса на [Не в сети]
      change_status_online('n')
    }
  },[ws_ref])

  async function verify_token(){
    try{
      if( token ){
        const response = await axios.post('http://localhost:8080/account/verify', {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if( !response.data?.message ){
          localStorage.removeItem('token');
        }
        if( response.data?.logout ){
          localStorage.removeItem('token');
          set_token(null);
        }
        if( response.data?.message ){
          let exp = response.data?.exp * 1000;
          let time = exp - Date.now();
          let time_left = time / 1000 / 60 / 60;
          let normal_time_left = time_left.toFixed(2) * 60 * 60 * 1000;
          set_timer(normal_time_left);
        }
        else if( response.data?.error ){
          console.log('Ошибка: ', response.data?.error);
        };
      }
    }
    catch(err){
      if( err.response?.data.error.name === 'TokenExpiredError' ){
        console.error( 'Ошибка: ', err.response.data.error.name);
        console.log('Время токена истекло.');
        set_token(null);
        localStorage.removeItem('token');
      }
      else{
        console.error('Ошибка: ',err);
        set_token(null);
        localStorage.removeItem('token');
      }
    }
  };

  useEffect(()=>{
    set_timer(null);
  },[])

  useEffect(()=>{
    if( localStorage.getItem('token') ){
      let t = localStorage.getItem('token');
      set_token(t);
    };

    if( timer === null ){
      set_timer(1)
    }
    else if( timer && token ){
      let n = Number((timer / 1000 / 60 / 60).toFixed(2));
      let hm_time = String(n);
      let h = hm_time.split('.')[0];
      let m = hm_time.split('.')[1];

      if( n > 0 ){
        console.log(`Проверка токена через ${h ? `${h}ч` : ''} ${m ? `${Math.floor(m / 100 * 60)}м` : ''}`);
      }
      else if( timer !== null && token && Number(h) === 0 && Number(m) === 0 ){
        console.log('Время токена истекло.');
        set_token(null);
        set_timer(null)
        localStorage.removeItem('token');
      }
      const t = setTimeout(()=>{
        verify_token();
      },timer);
    }
  },[token, timer]);

  async function get_my_id(type){
    if( !token ){ return };
    try{
      const response = await axios.post('http://localhost:8080/get_user_data', {

      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if( type === 'id' ){
        if( response?.data?.my_id ){
          return response?.data?.my_id;
        };
      };

      if( type === 'name' ){
        if( response?.data?.name ){
          return response?.data?.name;
        };
      }
    }
    catch(err){
      console.error('Ошибка получения id: ', err);
    }
  };

  useEffect(()=>{
    async function get_avatars(){
      if( my_data !== null ){
        const avatar_name = my_data.profil_avatar;
        if( avatar_name ){
          const files = (context) => context.keys().map(context);
          const avatars = files(require.context('../src/images/profils', false, /\.(jpg)$/));
          if( avatars ){
            avatars.map(img => {
              const raw_img_name = img.split('/')[3].split('.');
              const img_name = raw_img_name[0] + '.' + raw_img_name[2];
              if( img_name === my_data.profil_avatar ){
                set_avatar(img)
              }
              else{
                set_my_avatar(null);
              }
            })
          }
        }
      }
    }
    get_avatars()
  },[my_data])

  async function load_avatar(file){
    //после выбора файла
    if( !token ){
      return;
    };
    try{
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post('http://localhost:8080/load_avatar',  formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if( response.data?.message === 'Аватарка загружена на сервер' ){
        const file_name = response.data?.file_name;
        if( !file_name ){
          return;
        }
        // тут можно что-нибудь дописать :)
      }
    }
    catch(err){
      console.error('Ошибка загрузки аватарки на сервер: ', err)
    }
  };

  // СДЕЛАТЬ ПРИМЕНЕНИЕ НОВОЙ АВАТАРКИ ПРОФИДЯ К MEMBERS В ГРУППАХ
 
  async function select_file(file){
    if( !file ){
      return;
    };
    console.log(file);
    load_avatar(file);
  };

  useEffect(()=>{
    (async ()=>{
      try{
        await get_my_data();
      }
      catch(err){
        console.error('Ошибка: ', err);
      }
    })()
  },[token]);

  async function get_my_data(){
    if( !token ){
      return;
    };
    try{
      const response = await axios.post('http://localhost:8080/get_user_data', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      if( response.data?.my_email ){
        const data = {
          name: response.data?.my_name,
          email: response.data?.my_email,
          id: response.data?.my_id,
          date: response.data?.my_date,
          profil_avatar: response.data?.my_avatar,
        };
        if( data ){
          set_my_data(data);
          my_id_ref.current = data?.id;
        }
      };
    }
    catch(err){
      console.error('Ошибка получения данных о пользователе: ', err);
    }
  }; 

  useEffect(()=>{
    if( selected_avatar !== null && '' ){
      load_avatar();
    }
  },[selected_avatar])

  return (
    <BrowserRouter>
      <div className='main-row'>
        <div className='main-col'>
          <Header token={token} account_panel_active={account_panel_active} set_account_panel_active={set_account_panel_active} avatar={avatar}></Header> 
          <div className="container">
            <div className="body">
              <App_Router token={token} set_token={set_token} auto_login={auto_login} set_auto_login={set_auto_login} user_reg_data={user_reg_data} set_user_reg_data={set_user_reg_data} online={online} set_online={set_online} set_account_panel_active={set_account_panel_active} my_data={my_data} refresh_data={refresh_data} set_refresh_data={set_refresh_data} my_user_id={my_data?._id} visiable_panel_with_invites={visiable_panel_with_invites} set_visiable_panel_with_invites={set_visiable_panel_with_invites} visiable_panel_with_push_user_in_group={visiable_panel_with_push_user_in_group} set_visiable_panel_with_push_user_in_group={set_visiable_panel_with_push_user_in_group} ws_message_type={ws_message_type} ws_ref={ws_ref} set_log_in={set_log_in}></App_Router>
            </div>
          </div>
        </div>

        <div className='main-col-right' style={{width: `${account_panel_active ? '40%' : '0px'}`, display: `${account_panel_active ? '' : 'none'}`}}>
          <Account_Panel account_panel_active={account_panel_active} set_account_panel_active={set_account_panel_active} my_data={my_data} set_selected_avatar={set_selected_avatar} select_file={select_file} avatar={avatar} refresh_user_data={get_my_data}></Account_Panel>
        </div>
      </div>
      <Bottom></Bottom>
    </BrowserRouter>
  )
};

export default App;