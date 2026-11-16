import React, { useState, useEffect, useRef } from "react";
import cl from "./cl.module.css";
import Button_Default from "../buttons/button_default/button_default.jsx";
import $ from "jquery";
import axios from "axios";

export const Form_Create_New_Record_For_User_Page = ({
  close,
  user_page_id,
  get_posts,
  create_new_record,
  ws_ref,
}) => {
  const textarea_ref = useRef(null);
  const [text, set_text] = useState("");
  const [type, set_type] = useState("text");

  const btn_add_img_ref = useRef(null);
  const [files, set_files] = useState([]);
  const [previews, set_previews] = useState([]);
  const [selected_preview, set_selected_preview] = useState({});
  const frame_selected_preview = useRef(null);
  const [cell_down, set_cell_down] = useState(false);
  const [pos_down, set_pos_down] = useState(null);
  const [delete_button_down, set_delete_button_down] = useState(false);

  const [send_to_news, set_send_to_news] = useState(false);

  // ДИНАМИЧЕСКИЙ ТЕКСТАРЕА
  function resize_text_area() {
    const panel = document.querySelector(`.${cl.panel}`);
    const textarea = document.querySelector(`.${cl.textarea}`);
    const button = document.querySelector(`.${cl.button}`);
    if (!textarea || !panel || !button) {
      return;
    }
    const panel_size = panel.getBoundingClientRect();
    const textarea_size = textarea.getBoundingClientRect();
    const button_size = button.getBoundingClientRect();
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
    // textarea.style.minHeight = '50px';
    // textarea.style.maxHeight = `${panel_size?.height + (panel_size?.top - textarea_size?.top - (button_size?.height)) }px`;
  }

  useEffect(() => {
    window.addEventListener("resize", resize_text_area);
    return () => {
      window.removeEventListener("resize", resize_text_area);
    };
  }, []);
  useEffect(() => {
    const textarea = document.querySelector(`.${cl.textarea}`);
    if (textarea_ref.current !== null) {
      textarea_ref.current.style.height = "auto";
      textarea_ref.current.style.height = `${textarea_ref.current.scrollHeight}px`;
      if (
        textarea_ref.current.scrollHeight > textarea_ref.current.offsetHeight
      ) {
        textarea_ref.current.style.overflowY = "scroll";
      } else {
        textarea_ref.current.style.overflowY = "";
      }
    }
  }, [text, textarea_ref]);
  // КОНЕЦ ДИНАМИЧЕСКИЙ ТЕКСТАРЕА

  // ДЛЯ ИЗОБРАЖЕНИЙ
  function select_img() {
    if (btn_add_img_ref.current !== null) {
      btn_add_img_ref.current.click();
    }
  }

  function add_img_in_files(selected) {
    let files_length = 0;
    files_length += files.length;
    const already_files = files;
    let adding_files = [];
    let arr_files = Array.from(selected);
    if (arr_files.length > 0) {
      arr_files.map((arr_file) => {
        if (files_length < 6) {
          files_length += 1;
          set_files((files) => [...files, arr_file]);
          btn_add_img_ref.current.value = "";
        }
      });
    }
  }

  useEffect(() => {
    set_previews([]);
    if (files.length > 0) {
      const f = Array.from(files);
      if (f.length > 0) {
        f.map((file, index) => {
          let preview = URL.createObjectURL(file);
          set_previews((previews) => [...previews, preview]);
        });
      } else {
        set_previews([]);
      }
    }
  }, [files]);

  //
  function refresh_size() {
    // Получаем все нужные элементы
    if (document.body) {
      const body = document.querySelector(`.${cl.body}`);
      const fill = document.querySelector(`.${cl.fill}`);
      const img_add_btn = document.querySelector(`.${cl.img_add_btn}`);
      const grid = document.querySelector(`.${cl.grid}`);
      const cells = document.querySelectorAll(".grid_cell");

      if (!body || !fill || !img_add_btn || !grid || !cells.length) return;

      body.style.display = "none";
      fill.style.display = "none";
      img_add_btn.style.display = "none";
      grid.style.display = "none";
      cells.forEach((cell) => (cell.style.display = "none"));

      const d = document.body.offsetHeight; // БЕЗ ЭТОЙ ХРЕНИ SAFARI НЕ РАБОТАЕТ КОРРЕКТНО С FIXED!!!!!!!! МРАК.  ЯНДЕКС БРАУЗЕР ВАНЛАВ

      body.style.display = "";
      fill.style.display = "";
      img_add_btn.style.display = "";
      grid.style.display = "";
      cells.forEach((cell) => (cell.style.display = ""));

      if (document.body) {
        const body = document.querySelector(`.${cl.body}`);
        const fill = document.querySelector(`.${cl.fill}`);
        const img_add_btn = document.querySelector(`.${cl.img_add_btn}`);
        const grid = document.querySelector(`.${cl.grid}`);
        const cells = document.querySelectorAll(".grid_cell");

        if (!body || !fill || !img_add_btn || !grid || !cells.length) return;

        body.style.display = "none";
        fill.style.display = "none";
        img_add_btn.style.display = "none";
        grid.style.display = "none";
        cells.forEach((cell) => (cell.style.display = "none"));

        const d = document.body.offsetHeight; // БЕЗ ЭТОЙ ХРЕНИ SAFARI НЕ РАБОТАЕТ КОРРЕКТНО С FIXED!!!!!!!! МРАК.  ЯНДЕКС БРАУЗЕР ВАНЛАВ

        body.style.display = "";
        fill.style.display = "";
        img_add_btn.style.display = "";
        grid.style.display = "";
        cells.forEach((cell) => (cell.style.display = ""));
      }
    }
  }

  useEffect(() => {
    if (document.body) {
      refresh_size();
    }
  }, [files, previews]);
  function change_place_img(file, index, selected_cell) {
    console.log("selected_cell = ", selected_cell);
    if (file && index >= 0 && selected_cell) {
      // console.log('index = ', index);
      if (selected_cell !== undefined && selected_cell !== null) {
        const cell_size = selected_cell.getBoundingClientRect();
        const parent = selected_cell;
        const children_img = selected_cell.children[0]
          ? selected_cell.children[0].src
          : null;
        // console.log(children_img)
        if (children_img !== null) {
          set_selected_preview({
            file: file,
            index: index,
            cell_size: cell_size,
            src: children_img,
            selected_cell: selected_cell,
          });
        }
      }
    }
  }

  function handler_down_current_cell(e) {
    const down_x = e.clientX;
    const down_y = e.clientY;
    set_pos_down({
      x: down_x,
      y: down_y,
    });
    $(document).on("mouseup", {}, handler_up_current_cell);
    set_cell_down(true);
    return () => {
      $(document).off();
    };
  }
  function handler_up_current_cell(e) {
    if (cell_down && !delete_button_down) {
      set_cell_down(false);
      set_pos_down(null);
      frame_selected_preview.current.style.display = "none";
      const cursor_x = e.clientX;
      const cursor_y = e.clientY;
      const previews_blocks = document.querySelectorAll(".grid_cell");
      if (Array.from(previews_blocks).length > 0) {
        Array.from(previews_blocks).map((item) => {
          item.style.border = "";
        });
      }
      Array.from(previews_blocks).map((preview, index) => {
        preview.children[1].style.display = "";
        const preview_pos = preview.getBoundingClientRect();
        if (
          cursor_x > preview_pos?.left &&
          cursor_x < preview_pos?.left + preview_pos?.width &&
          cursor_y > preview_pos?.top &&
          cursor_y < preview_pos?.top + preview_pos?.height
        ) {
          if (previews.length > 1) {
            [previews[selected_preview?.index], previews[index]] = [
              previews[index],
              previews[selected_preview?.index],
            ];
            [files[selected_preview?.index], files[index]] = [
              files[index],
              files[selected_preview?.index],
            ];
          }
        } else {
          preview.style.border = "";
        }
      });
    }
  }

  function handler_mouse_move(e) {
    if (pos_down !== null && cell_down && !delete_button_down) {
      const delete_preview = frame_selected_preview.current;
      if (
        frame_selected_preview.current.style.display === "" ||
        (frame_selected_preview.current.style.display === "none" &&
          delete_preview.style.options !== 1)
      ) {
        frame_selected_preview.current.style.display = "flex";
      }
      const cursor_x = e.clientX;
      const cursor_y = e.clientY;
      const frame_pos = frame_selected_preview.current.getBoundingClientRect();

      const previews_blocks = document.querySelectorAll(".grid_cell");
      if (previews_blocks.length > 1) {
        Array.from(previews_blocks).map((preview) => {
          preview.children[1].style.display = "none";
        });
        frame_selected_preview.current.style.left = `${cursor_x - frame_pos?.width / 2}px`;
        frame_selected_preview.current.style.top = `${cursor_y - frame_pos?.height / 2}px`;
        if (
          selected_preview.src === null ||
          selected_preview.src === undefined ||
          selected_preview.src === ""
        ) {
          set_pos_down(null);
          set_cell_down(false);
          set_pos_down(null);
        }
      } else {
        frame_selected_preview.current.style.display = "none";
      }
    }
  }

  useEffect(() => {
    if (document && cell_down) {
      $(document).off();
      $(document).on("mousemove", handler_mouse_move);
    }
    return () => {
      $(document).off();
    };
  }, [cell_down]);

  useEffect(() => {
    if (frame_selected_preview.current !== null && !delete_button_down) {
      $(frame_selected_preview.current).off();
      $(frame_selected_preview.current).on(
        "mouseleave",
        {},
        handler_up_current_cell,
      );
      $(frame_selected_preview.current).on(
        "mouseup",
        {},
        handler_up_current_cell,
      );
    }
    return () => {
      $(frame_selected_preview.current).off();
    };
  }, [frame_selected_preview, cell_down, delete_button_down]);

  function delete_button_is_enter() {
    set_delete_button_down(true);
  }
  function delete_button_is_up() {
    set_delete_button_down(false);
  }

  useEffect(() => {
    const g_c = document.querySelectorAll(".grid_cell");
    if (g_c.length > 0) {
      console.log("+");
    }
    if (document) {
      const buttons_delete = document.querySelectorAll(`.${cl.delete_preview}`);
      if (buttons_delete.length > 0) {
        Array.from(buttons_delete).map((btn) => {
          $(btn).on("mouseenter", {}, delete_button_is_enter);
          $(btn).on("mouseleave", {}, delete_button_is_up);
          $(document).on("mouseup", {}, delete_button_is_up);
        });
      }
    }
    return () => {
      const buttons_delete = document.querySelectorAll(`.${cl.delete_preview}`);
      if (buttons_delete.length > 0) {
        Array.from(buttons_delete).map((btn) => {
          $(btn).off();
          $(document).off();
        });
      }
    };
  }, [previews, selected_preview, document]);

  function remove_img(index, e) {
    const selected_img = index;
    if (
      !selected_img >= 0 &&
      selected_img === null &&
      selected_img === undefined
    ) {
      return;
    }
    const arr_files = Array.from(files);
    const filtered_files = arr_files.filter(
      (file, file_index) => file_index !== selected_img,
    );
    console.log(filtered_files);
    btn_add_img_ref.current.value = "";
    set_files(filtered_files);
  }

  function add_img() {
    if (btn_add_img_ref.current !== null) {
      btn_add_img_ref.current.click();
    }
  }

  async function add_new_post() {
    const token = localStorage.getItem("token");
    const unique_token = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(6, "0");
    if (text.length === 0 && files.length === 0) {
      return;
    }
    if (text.length === 0 && files.length > 0) {
      // ПРЕДЗАГРУЗКА ФАЙЛОВ
      const pre_files = files;
      if (!pre_files.length > 0) {
        return;
      }
      try {
        const uploaded_files = pre_files.map((file, index) => {
          console.log("uploaded_files => file = ", file);
          const formData = new FormData();
          formData.append("user_page_id", user_page_id);
          formData.append("file_index", index);
          formData.append("file", file);
          const filtered_files = files.filter((f) => f !== file);
          set_files(filtered_files);
          const response = axios.post(
            "http://localhost:8080/pre_loader_files_for_user_page",
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          if (response) {
            // КАК-ТО СДЕЛАТЬ ПРОВЕРКУ СТАТУСА ПРОМИСА. Promise?.status НЕ РАБОТАЕТ!
            return response;
          } else {
            console.log("Загрузка файла не удалась. ");
          }
        });
        const loaded_files = await Promise.all(uploaded_files);
        console.log("Предзагруженные файлы: ", loaded_files);
        const failed_uploads = loaded_files.filter(
          (response) => !response?.data?.loaded_file,
        );
        if (failed_uploads.length > 0 || loaded_files.length !== files.length) {
          return console.error(
            `Не загружены все изображения: ${loaded_files.length - failed_uploads.length}/${files.length}`,
          );
        }
        // ШАГ 2 - ОТПРАВКА ПОСТА
        const formData_to_post = new FormData();
        formData_to_post.append("user_page_id", user_page_id);
        formData_to_post.append("files", JSON.stringify(loaded_files));
        formData_to_post.append("unique_token", unique_token);
        const response_send_post = await axios.post(
          "http://localhost:8080/send_post_in_user_page",
          formData_to_post,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (response_send_post?.data?.message) {
          console.log(response_send_post?.data?.message);
          if (response_send_post?.data?.refresh === true) {
            // обновление контента
            close_this();
            await get_posts();
            if (ws_ref.current !== null && ws_ref.current.readyState === 1) {
              ws_ref.current.onopen = () => {
                ws_ref.current.send(
                  JSON.stringify({
                    type: "new_post_user_page",
                  }),
                );
              };
            }
          }
        } else {
          console.log("Нет ответа от сервера");
        }
        if (!send_to_news) {
          return;
        }
        // ШАГ 3 - ОТПРАВКА В НОВОСТНОЙ КАНАЛ
        try {
          const formData_to_post_for_main = new FormData();
          formData_to_post_for_main.append("id_who_send", user_page_id);
          formData_to_post_for_main.append(
            "images",
            JSON.stringify(loaded_files),
          );
          formData_to_post_for_main.append("from", user_page_id);
          formData_to_post_for_main.append("user_page_id", user_page_id);
          formData_to_post_for_main.append("unique_token", unique_token);
          const response_send_post_in_main = await axios.post(
            "http://localhost:8080/add_posts_for_main_page",
            formData_to_post_for_main,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          if (response_send_post_in_main?.added) {
            if (ws_ref.current !== null) {
              ws_ref.current.onopen = () => {
                ws_ref.current.send(
                  JSON.stringify({
                    type: "new_post_main",
                  }),
                );
              };
            }
          }
        } catch (err) {
          console.error("Ошибка отправки в новостной канал: ", err);
        }
      } catch (err) {
        return console.error("Ошибка загрузки изображения!", err);
      }
    }
    if (text.length > 0 && files.length === 0) {
      // загружаем текст
      try {
        // ОТПРАВКА ПОСТА
        const formData_to_post = new FormData();
        formData_to_post.append("user_page_id", user_page_id);
        formData_to_post.append("text", text);
        formData_to_post.append("unique_token", unique_token);
        const response_send_post = await axios.post(
          "http://localhost:8080/send_post_in_user_page",
          formData_to_post,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (response_send_post?.data?.message) {
          console.log(response_send_post?.data?.message);
          if (response_send_post?.data?.refresh === true) {
            // обновление контента
            close_this();
            await get_posts();

            if (ws_ref.current !== null) {
              ws_ref.current.onopen = () => {
                ws_ref.current.send(
                  JSON.stringify({
                    type: "new_post_user_page",
                  }),
                );
              };
            }
          }
        } else {
          console.log("Нет ответа от сервера");
        }
      } catch (err) {
        console.error("Ошибка: ", err);
      }
      if (!send_to_news) {
        return;
      }
      // ШАГ 3 - ОТПРАВКА В НОВОСТНОЙ КАНАЛ
      try {
        const formData_to_post_for_main = new FormData();
        formData_to_post_for_main.append("id_who_send", user_page_id);
        formData_to_post_for_main.append("from", user_page_id);
        formData_to_post_for_main.append("user_page_id", user_page_id);
        formData_to_post_for_main.append("text", JSON.stringify(text));
        formData_to_post_for_main.append("unique_token", unique_token);
        const response_send_post_in_main = await axios.post(
          "http://localhost:8080/add_posts_for_main_page",
          formData_to_post_for_main,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (response_send_post_in_main?.added) {
          if (ws_ref.current !== null) {
            ws_ref.current.onopen = () => {
              ws_ref.current.send(
                JSON.stringify({
                  type: "new_post_main",
                }),
              );
            };
          }
        }
      } catch (err) {
        console.error("Ошибка отправки в новостной канал: ", err);
      }
    }
    if (text.length > 0 && files.length > 0) {
      // загружаем файлы и текст
      try {
        const uploaded_files = files.map((file) => {
          const formData = new FormData();
          formData.append("user_page_id", user_page_id);
          //
          formData.append("file", file);
          //
          const response = axios.post(
            "http://localhost:8080/pre_loader_files_for_user_page",
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          if (response) {
            // КАК-ТО СДЕЛАТЬ ПРОВЕРКУ СТАТУСА ПРОМИСА. Promise?.status НЕ РАБОТАЕТ!
            return response;
          } else {
            console.log("Загрузка файла не удалась. ");
          }
        });
        const loaded_files = await Promise.all(uploaded_files);
        console.log("Предзагруженные файлы: ", loaded_files);
        const failed_uploads = loaded_files.filter(
          (response) => !response?.data?.loaded_file,
        );
        if (failed_uploads.length > 0 || loaded_files.length !== files.length) {
          return console.error(
            `Не загружены все изображения: ${loaded_files.length - failed_uploads.length}/${files.length}`,
          );
        }
        // ШАГ 2 - ОТПРАВКА ПОСТА
        const formData_to_post = new FormData();
        formData_to_post.append("user_page_id", user_page_id);
        formData_to_post.append("files", JSON.stringify(loaded_files));
        formData_to_post.append("text", text);
        formData_to_post.append("unique_token", unique_token);
        const response_send_post = await axios.post(
          "http://localhost:8080/send_post_in_user_page",
          formData_to_post,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (response_send_post?.data?.message) {
          console.log(response_send_post?.data?.message);
          if (response_send_post?.data?.refresh === true) {
            // обновление контента
            close_this();
            await get_posts();

            if (ws_ref.current !== null) {
              ws_ref.current.onopen = () => {
                ws_ref.current.send(
                  JSON.stringify({
                    type: "new_post_user_page",
                  }),
                );
              };
            }
          }
        } else {
          console.log("Нет ответа от сервера");
        }
        if (!send_to_news) {
          return;
        }
        // ШАГ 3 - ОТПРАВКА В НОВОСТНОЙ КАНАЛ
        try {
          const formData_to_post_for_main = new FormData();
          formData_to_post_for_main.append("id_who_send", user_page_id);
          formData_to_post_for_main.append(
            "images",
            JSON.stringify(loaded_files),
          );
          formData_to_post_for_main.append("from", user_page_id);
          formData_to_post_for_main.append("user_page_id", user_page_id);
          formData_to_post_for_main.append("text", JSON.stringify(text));
          formData_to_post_for_main.append("unique_token", unique_token);
          const response_send_post_in_main = await axios.post(
            "http://localhost:8080/add_posts_for_main_page",
            formData_to_post_for_main,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          if (response_send_post_in_main?.added) {
            if (ws_ref.current !== null) {
              ws_ref.current.onopen = () => {
                ws_ref.current.send(
                  JSON.stringify({
                    type: "new_post_main",
                  }),
                );
              };
            }
          }
        } catch (err) {
          console.error("Ошибка отправки в новостной канал: ", err);
        }
      } catch (err) {
        return console.error("Ошибка загрузки изображения!", err);
      }
    }
  }

  function close_this() {
    btn_add_img_ref.current.value = "";
    set_files([]);
    set_previews([]);
    set_text("");
    close(false);
  }

  return (
    <div
      className={cl.form_create_new_record_for_user_page}
      onClick={(e) => {
        close(false);
      }}
    >
      {cell_down && (
        <div ref={frame_selected_preview} className={cl.frame_selected_preview}>
          <img src={selected_preview?.src} alt="картинка" />
        </div>
      )}
      <div
        className={cl.panel}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <form className={cl.invisiable_form_select_img}>
          <input
            ref={btn_add_img_ref}
            type="file"
            onChange={(e) => {
              add_img_in_files(e.target.files);
            }}
            accept={"image/jpeg"}
            multiple="multiple"
          />
        </form>
        <div className={cl.buttons}>
          <Button_Default
            onClick={() => {
              set_type("text");
              set_files([]);
            }}
          >
            Текст
          </Button_Default>
          <Button_Default
            onClick={() => {
              set_type("img");
              set_text("");
            }}
          >
            Изображение
          </Button_Default>
          <Button_Default
            onClick={() => {
              set_type("all");
            }}
          >
            Текст + Изображение
          </Button_Default>
        </div>
        <div className={cl.content}>
          {type === "text" ? (
            <div className={cl.text}>
              <div className={cl.textbox}>
                <textarea
                  ref={textarea_ref}
                  className={cl.textarea}
                  maxLength="9999"
                  placeholder="..."
                  onChange={(e) => {
                    set_text(e.target.value);
                  }}
                ></textarea>
              </div>
              <div className={cl.checked}>
                <div className={cl.text}>Опубликовать в новостной канал</div>
                <input
                  type="checkbox"
                  checked={send_to_news}
                  onChange={(e) => {
                    set_send_to_news(e.target.checked);
                  }}
                />
              </div>
              <div
                className={`${cl.send} ${text.trim("").length === 0 && cl.disabled}`}
              >
                <div
                  className={cl.send_in}
                  onClick={() => {
                    add_new_post();
                  }}
                >
                  Отправить
                </div>
              </div>
            </div>
          ) : type === "img" ? (
            <div>
              {type === "img" && (
                <div className={""}>
                  <div className={cl.content_img}>
                    <div
                      className={cl.grid}
                      style={{
                        gridTemplateColumns:
                          previews.length === 1
                            ? "minmax(10px, auto)"
                            : previews.length === 2
                              ? "repeat(2, minmax(10px, auto))"
                              : previews.length === 3
                                ? "repeat(3, minmax(10px, auto))"
                                : previews.length === 4
                                  ? "repeat(2, minmax(10px, auto))"
                                  : previews.length === 5
                                    ? "repeat(5, minmax(10px, auto))"
                                    : previews.length === 6 &&
                                      "repeat(3, minmax(10px, auto))",
                        aspectRatio: previews.length === 5 && "1.5/0.4",
                      }}
                    >
                      {/* максимум 6 изображений */}
                      {previews.length > 0 &&
                        previews.map((file, index) => (
                          <div
                            key={index}
                            className={`${cl.grid_cell} grid_cell`}
                            onMouseDown={(e) => {
                              change_place_img(file, index, e.target);
                              handler_down_current_cell(e);
                            }}
                            onMouseUp={handler_up_current_cell}
                          >
                            <img src={file} />
                            <div
                              className={cl.delete_preview}
                              onClick={(e) => {
                                remove_img(index, e);
                              }}
                            >
                              x
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  {previews.length < 6 && (
                    <div
                      className={cl.img_add_btn}
                      onClick={() => {
                        add_img();
                      }}
                    >
                      Добавить
                    </div>
                  )}
                </div>
              )}
              <div className={cl.checked}>
                <div className={cl.text}>Опубликовать в новостной канал</div>
                <input
                  type="checkbox"
                  checked={send_to_news}
                  onChange={(e) => {
                    set_send_to_news(e.target.checked);
                  }}
                />
              </div>
              <div
                className={`${cl.send} ${(text.trim("").length > 0 || files.length === 0) && cl.disabled}`}
              >
                <div
                  className={cl.send_in}
                  onClick={() => {
                    add_new_post();
                  }}
                >
                  Отправить
                </div>
              </div>
            </div>
          ) : (
            type === "all" && (
              <div className={cl.text_and_img}>
                <div className={cl.textbox}>
                  <textarea
                    ref={textarea_ref}
                    className={cl.textarea}
                    maxLength="9999"
                    placeholder="..."
                    onChange={(e) => {
                      set_text(e.target.value);
                    }}
                  ></textarea>
                </div>
                <div className={""}>
                  <div className={cl.content_img}>
                    <div
                      className={cl.grid}
                      style={{
                        gridTemplateColumns:
                          previews.length === 1
                            ? "minmax(10px, auto)"
                            : previews.length === 2
                              ? "repeat(2, minmax(10px, auto))"
                              : previews.length === 3
                                ? "repeat(3, minmax(10px, auto))"
                                : previews.length === 4
                                  ? "repeat(2, minmax(10px, auto))"
                                  : previews.length === 5
                                    ? "repeat(5, minmax(10px, auto))"
                                    : previews.length === 6 &&
                                      "repeat(3, minmax(10px, auto))",
                        aspectRatio: previews.length === 5 && "1.5/0.4",
                      }}
                    >
                      {/* максимум 6 изображений */}
                      {previews.length > 0 &&
                        previews.map((file, index) => (
                          <div
                            key={index}
                            className={`${cl.grid_cell} grid_cell`}
                            onMouseDown={(e) => {
                              change_place_img(file, index, e.target);
                              handler_down_current_cell(e);
                            }}
                            onMouseUp={handler_up_current_cell}
                          >
                            <img src={file} />
                            <div
                              className={cl.delete_preview}
                              onClick={(e) => {
                                remove_img(index, e);
                              }}
                            >
                              x
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  {previews.length < 6 && (
                    <div
                      className={cl.img_add_btn}
                      onClick={() => {
                        add_img();
                      }}
                    >
                      Добавить
                    </div>
                  )}
                </div>
                <div className={cl.checked}>
                  <div className={cl.text}>Опубликовать в новостной канал</div>
                  <input
                    type="checkbox"
                    checked={send_to_news}
                    onChange={(e) => {
                      set_send_to_news(e.target.checked);
                    }}
                  />
                </div>
                <div
                  className={`${cl.send} ${(text.trim("").length === 0 || files.length === 0) && cl.disabled}`}
                >
                  <div
                    className={cl.send_in}
                    onClick={() => {
                      add_new_post();
                    }}
                  >
                    Отправить
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Form_Create_New_Record_For_User_Page;
