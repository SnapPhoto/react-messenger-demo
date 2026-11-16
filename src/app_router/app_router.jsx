import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import Main from "../code/pages/main/main";
import Login from "../code/pages/login/login";
import Register from "../code/pages/register/register";
import Peoples from "../code/pages/peoples/peoples";
import Not_Found from "../code/pages/not_found/not_found";
import Friends from "../code/pages/friends/friends";
import Account_Settings from "../code/pages/account_settings/account_settings";
import Account_Mail from "../code/pages/account_mail/account_mail.jsx";
import Account_Current_Mails from "../code/pages/account_current_mails/account_current_mails";
import Not_Online from "../code/pages/not_online/not_online.jsx";
import Logout from "../code/pages/logout/logout.jsx";
import User_Page from "../code/pages/user_page/user_page.jsx";
import Groups from "../code/pages/groups_page/groups";
import Current_Group from "../code/pages/current_group/current_group";
import Favourites from "../code/pages/favourites/favourites.jsx";

export const App_Router = ({
  auto_login,
  set_auto_login,
  user_reg_data,
  set_user_reg_data,
  token,
  set_token,
  online,
  set_online,
  set_account_panel_active,
  user_page_name,
  my_data,
  refresh_data,
  set_refresh_data,
  visiable_panel_with_invites,
  set_visiable_panel_with_invites,
  visiable_panel_with_push_user_in_group,
  set_visiable_panel_with_push_user_in_group,
  ws_message_type,
  ws_ref,
  all_notifications,
}) => {
  // ws_message_type - тип сообщения, отправленного через websocket для обновления нужных функций

  const [name_of_current_mail, set_name_of_current_mail] = useState("");
  const [curr_user, set_curr_user] = useState("");
  const [s_user, set_s_user] = useState("");

  const [my_id, set_my_id] = useState(null);

  const name_of_current_mail_ref = useRef(null);
  const selected_user_ref = useRef("");

  const navigate = useNavigate();

  const { current_id } = useParams();

  // group
  const [current_group_id, set_current_group_id] = useState("");
  const [role, set_role] = useState(null);
  const [my_groups, set_my_groups] = useState([]);

  // useEffect(()=>{
  // 	if( name_of_current_mail !== '' ){
  // 		if( name_of_current_mail === '' ){
  // 			return;
  // 		}
  // 		const re_name = name_of_current_mail.trim().split(' ').join(',').replace(",","_");
  // 		set_name_of_current_mail(re_name);
  // 		navigate(`/mail/${current_id}/${re_name}/mails`);
  // 		return ()=>{set_current_group_id('')};
  // 	};
  // 	return ()=>{
  // 		set_name_of_current_mail('');
  // 	}
  // },[name_of_current_mail]);

  useEffect(() => {
    if (s_user !== "") {
      selected_user_ref.current = s_user;
    }
  }, [s_user]);

  useEffect(() => {
    if (current_group_id !== "") {
      console.log("+");
      navigate(`/main/current_group/${current_group_id}/page`);
    } else if (current_group_id === null || current_group_id === undefined) {
      console.warn("???");
    }
  }, [current_group_id]);

  async function jump_to_login_page() {
    localStorage.clear();
    await navigate("/account/logout");
  }

  return online ? (
    token ? (
      <Routes>
        <Route
          path="/main"
          element={
            <Main
              my_id={my_id}
              visiable_panel_with_invites={visiable_panel_with_invites}
              set_visiable_panel_with_invites={set_visiable_panel_with_invites}
              ws_message_type={ws_message_type}
              ws_ref={ws_ref}
              my_name={my_data?.name}
              all_notifications={all_notifications}
            ></Main>
          }
        ></Route>
        <Route
          path="/main/peoples"
          element={
            <Peoples
              token={token}
              set_token={set_token}
              set_s_user={set_s_user}
              set_curr_user={set_curr_user}
              set_name_of_current_mail={set_name_of_current_mail}
              my_id={my_data?.id}
              visiable_panel_with_invites={visiable_panel_with_invites}
              set_visiable_panel_with_invites={set_visiable_panel_with_invites}
              ws_message_type={ws_message_type}
              ws_ref={ws_ref}
              my_name={my_data?.name}
              all_notifications={all_notifications}
            ></Peoples>
          }
        ></Route>
        <Route
          path="/main/friends"
          element={
            <Friends
              token={token}
              set_s_user={set_s_user}
              set_curr_user={set_curr_user}
              set_name_of_current_mail={set_name_of_current_mail}
              my_id={my_data?.id}
              visiable_panel_with_invites={visiable_panel_with_invites}
              set_visiable_panel_with_invites={set_visiable_panel_with_invites}
              ws_message_type={ws_message_type}
              ws_ref={ws_ref}
              my_name={my_data?.name}
              all_notifications={all_notifications}
            ></Friends>
          }
        ></Route>
        <Route
          path="/account/login"
          element={
            <Main
              my_id={my_id}
              visiable_panel_with_invites={visiable_panel_with_invites}
              set_visiable_panel_with_invites={set_visiable_panel_with_invites}
              ws_message_type={ws_message_type}
              ws_ref={ws_ref}
              my_name={my_data?.name}
              all_notifications={all_notifications}
            ></Main>
          }
        ></Route>
        <Route
          path="/account/logout"
          element={
            <Logout
              token={token}
              set_token={set_token}
              set_account_panel_active={set_account_panel_active}
              ws_ref={ws_ref}
            ></Logout>
          }
        ></Route>
        <Route
          path="/account/settings"
          element={
            <Account_Settings
              my_id={my_data?.id}
              jump_to_login_page={jump_to_login_page}
            ></Account_Settings>
          }
        ></Route>
        <Route
          path="/account/mail"
          element={
            <Account_Mail
              token={token}
              set_name_of_current_mail={set_name_of_current_mail}
              set_curr_user={set_curr_user}
              my_id={my_data?.id}
              visiable_panel_with_invites={visiable_panel_with_invites}
              set_visiable_panel_with_invites={set_visiable_panel_with_invites}
              ws_message_type={ws_message_type}
              ws_ref={ws_ref}
              my_name={my_data?.name}
              all_notifications={all_notifications}
            ></Account_Mail>
          }
        ></Route>
        <Route
          path={`/mail/:id_from/:id_to/:current_name/mails`}
          element={
            <Account_Current_Mails
              to={curr_user}
              raw_name_of_current_mail={name_of_current_mail}
              raw_curr_user={curr_user}
              raw_my_data={my_data}
              refresh_data={refresh_data}
              set_refresh_data={set_refresh_data}
              set_s_user={set_s_user}
              my_id={my_data?.id}
              visiable_panel_with_invites={visiable_panel_with_invites}
              set_visiable_panel_with_invites={set_visiable_panel_with_invites}
              ws_message_type={ws_message_type}
              ws_ref={ws_ref}
              my_name={my_data?.name}
              all_notifications={all_notifications}
            ></Account_Current_Mails>
          }
        ></Route>
        <Route path="*" element={<Not_Found></Not_Found>}></Route>
        <Route
          path={`/main/:user_id/page`}
          element={
            <User_Page
              raw_user={s_user ? s_user : null}
              raw_curr_user={curr_user || null}
              my_id={my_data?.id || my_id}
              my_groups={my_groups}
              set_current_group_id={set_current_group_id}
              token={token}
              set_s_user={set_s_user}
              visiable_panel_with_invites={visiable_panel_with_invites}
              set_visiable_panel_with_invites={set_visiable_panel_with_invites}
              ws_message_type={ws_message_type}
              ws_ref={ws_ref}
              my_name={my_data?.name}
              all_notifications={all_notifications}
            ></User_Page>
          }
        ></Route>
        <Route
          path="/main/groups"
          element={
            <Groups
              set_current_group_id={set_current_group_id}
              current_group_id={current_group_id}
              my_id={my_data?.id}
              return_my_groups={set_my_groups}
              visiable_panel_with_invites={visiable_panel_with_invites}
              set_visiable_panel_with_invites={set_visiable_panel_with_invites}
              ws_message_type={ws_message_type}
              ws_ref={ws_ref}
              my_name={my_data?.name}
              all_notifications={all_notifications}
            ></Groups>
          }
        ></Route>
        <Route
          path={`/main/current_group/:this_group_id/page`}
          element={
            <Current_Group
              my_id={my_data.id}
              return_my_role={set_role}
              visiable_panel_with_invites={visiable_panel_with_invites}
              set_visiable_panel_with_invites={set_visiable_panel_with_invites}
              visiable_panel_with_push_user_in_group={
                visiable_panel_with_push_user_in_group
              }
              set_visiable_panel_with_push_user_in_group={
                set_visiable_panel_with_push_user_in_group
              }
              ws_message_type={ws_message_type}
              ws_ref={ws_ref}
              my_name={my_data?.name}
              all_notifications={all_notifications}
            ></Current_Group>
          }
        ></Route>
        <Route
          path={`/main/:my_id/favourites`}
          element={
            <Favourites
              my_id={my_data.id}
              visiable_panel_with_invites={visiable_panel_with_invites}
              set_visiable_panel_with_invites={set_visiable_panel_with_invites}
              ws_message_type={ws_message_type}
              ws_ref={ws_ref}
              my_name={my_data?.name}
              all_notifications={all_notifications}
            ></Favourites>
          }
        ></Route>
      </Routes>
    ) : (
      <Routes>
        <Route
          path="/account/login"
          element={
            <Login
              set_token={set_token}
              auto_login={auto_login}
              user_reg_data={user_reg_data}
              set_user_reg_data={set_user_reg_data}
              set_my_id={set_my_id}
              ws_ref={ws_ref}
            ></Login>
          }
        ></Route>
        <Route
          path="/account/register"
          element={
            <Register
              set_auto_login={set_auto_login}
              set_user_reg_data={set_user_reg_data}
              set_my_id={set_my_id}
              ws_ref={ws_ref}
            ></Register>
          }
        ></Route>
        <Route
          path="*"
          element={
            <Login
              set_token={set_token}
              auto_login={auto_login}
              user_reg_data={user_reg_data}
              set_user_reg_data={set_user_reg_data}
              ws_ref={ws_ref}
            ></Login>
          }
        ></Route>
      </Routes>
    )
  ) : (
    <Routes>
      <Route path="*" element={<Not_Online></Not_Online>}></Route>
    </Routes>
  );
};

export default App_Router;
