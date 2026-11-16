import React, { useState, useEffect, useRef } from "react";
import cl from "./change_content.module.css";
import axios from "axios";
import $ from "jquery";

export const Form_Change_Record = ({
  close,
  type,
  group_data,
  get_posts,
  exist_text,
  curr_user,
  images,
  images_from_max,
  id,
  content_id,
  content_id_for_current_mails,
  old_text,
  user_id,
  for_current_mails,
  my_id,
  other_id,
  scroll_to_it_after_changed,
  remove_content_for_current_mail,
  ws_message_type,
  ws_ref,
}) => {
  const [text, set_text] = useState(old_text);
  const textarea_ref = useRef(null);
  const btn_add_img_ref = useRef(null);

  const [exist_files, set_exist_files] = useState(images); // существующие файлы (их внутренние названия: file_name, full_name, file_path);
  const [files, set_files] = useState([]); // новые файлы для загрузки на сервер
  const [previews, set_previews] = useState([]); // превью - отображение
  const [selected_preview, set_selected_preview] = useState({}); // выбранный фрейм для перемещения

  const frame_selected_preview = useRef(null);
  const [cell_down, set_cell_down] = useState(false);
  const [pos_down, set_pos_down] = useState(false);
  const [delete_button_down, set_delete_button_down] = useState(false);

  const [files_exist, set_files_exist] = useState([]);

  const [removable_files, set_removable_files] = useState([]); // файлы, которые будут удалены (их имена)

  useEffect(() => {
    set_files_exist([]);
    set_files([]);
    set_previews([]);
  }, []);

  useEffect(() => {
    try {
      let asset_entries = [];
      if (user_id && !for_current_mails) {
        const context = require.context(
          "../../images/user_page_images",
          true,
          /\.(jpg|jpeg|png|webp)$/i,
        );
        asset_entries = context
          .keys()
          .filter((key) => key.includes(`/${user_id}/`))
          .map((key) => ({ key, asset: context(key) }));
      } else if (!user_id && !for_current_mails) {
        const context = require.context(
          "../../images/groups_images",
          true,
          /\.(jpg|jpeg|png|webp)$/i,
        );
        asset_entries = context
          .keys()
          .filter((key) => key.includes(`/${id}/`))
          .map((key) => ({ key, asset: context(key) }));
      } else if (for_current_mails) {
        const context = require.context(
          "../../images/max",
          false,
          /\.(jpg|jpeg|png|webp)$/i,
        );
        asset_entries = context
          .keys()
          .map((key) => ({ key, asset: context(key) }));
      }
      const asset_filename = (key) => {
        const raw_name = key.split("/").pop() || "";
        const hash_suffix = raw_name.match(
          /^(.*)_([0-9a-f]{8,})\.(jpg|jpeg|png|webp)$/i,
        );
        return hash_suffix ? `${hash_suffix[1]}.${hash_suffix[3]}` : raw_name;
      };
      const flatten_entries = (value) => {
        if (typeof value === "string") {
          try {
            return flatten_entries(JSON.parse(value));
          } catch {
            return [];
          }
        }
        if (Array.isArray(value)) return value.flatMap(flatten_entries);
        if (value?.data?.loaded_file || value?.loaded_file || value?.old_file) {
          return [value];
        }
        if (value?.data && typeof value.data === "object") {
          return flatten_entries(value.data);
        }
        return [];
      };
      const entries = flatten_entries(images);
      const get_loaded_file = (value, depth = 0) => {
        if (depth > 8 || value == null) return {};
        if (typeof value === "string") {
          try {
            return get_loaded_file(JSON.parse(value), depth + 1);
          } catch {
            return {};
          }
        }
        if (Array.isArray(value)) {
          for (const child of value) {
            const loaded = get_loaded_file(child, depth + 1);
            if (loaded.name || loaded.file_name || loaded.full_name)
              return loaded;
          }
          return {};
        }
        if (typeof value !== "object") return {};
        if (value.loaded_file)
          return get_loaded_file(value.loaded_file, depth + 1);
        if (value.old_file) return get_loaded_file(value.old_file, depth + 1);
        if (value.data) return get_loaded_file(value.data, depth + 1);
        return value.name || value.file_name || value.full_name ? value : {};
      };
      const next_files = [];
      const next_previews = [];
      for (const entry of entries) {
        const file_entry = entry?.old_file || entry;
        const loaded = get_loaded_file(file_entry);
        const filename_candidates = [
          loaded.name,
          loaded.file_name,
          loaded.full_name,
        ].filter((name) => typeof name === "string" && name.length > 0);
        if (filename_candidates.length === 0) continue;
        const found = asset_entries.find(({ key }) => {
          const raw_filename = key.split("/").pop() || "";
          return filename_candidates.some(
            (filename) =>
              asset_filename(key) === filename || raw_filename === filename,
          );
        });
        const preview =
          found?.asset ||
          `/images/max/${encodeURIComponent(filename_candidates[0])}`;
        next_files.push({ old_file: file_entry, type: "empty" });
        next_previews.push(preview);
      }
      set_files(next_files);
      set_exist_files(images || []);
      set_files_exist(next_previews);
      set_previews(next_previews);
    } catch (err) {
      console.error(
        "Не удалось восстановить исходный порядок изображений редактора:",
        err,
      );
    }
  }, [images, id, user_id, for_current_mails]);

  useEffect(() => {
    if (files.length > 0 && previews.length < 6) {
      if (files_exist.length > 0) {
        set_previews(files_exist);
      }
      files.forEach((file, index) => {
        if (file?.type !== "empty") {
          const file_url = URL.createObjectURL(file);
          set_previews((previews) => [...previews, file_url]);
        }
      });
    }
  }, [files, files_exist]);

  useEffect(() => {
    if (previews.length > 0) {
      previews.forEach((preview) => console.log("[209] preview = ", preview));
    }
  }, [previews]);

  useEffect(() => {
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

  function close_this() {
    btn_add_img_ref.current.value = "";
    set_files([]);
    set_previews([]);
    set_text("");
    close(false);
    set_removable_files([]);
  }

  function add_img() {
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
        if (files_length < 6 && previews.length < 6) {
          files_length += 1;
          set_previews([]);
          set_files((files) => [...files, arr_file]);
          btn_add_img_ref.current.value = "";
        }
      });
    }
  }

  // ДОРАБОТАТЬ!!!! ВОЗМОЖНО ВСЁ ПЕРЕДЕЛАТЬ, ИНОГДА АРТЕФАКТЫ ВЫЛАЗЯТ,
  // ОШИБКА ВРОДЕ В require.context , БАГИ ИМЕННО ТАМ КАК ПОКАЗЫВАЕТСЯ СЕРВЕР

  async function remove_img(index, e) {
    console.log("[remove_img]");
    const selected_img = index;
    console.log("selected_img = ", selected_img);
    if (
      !selected_img >= 0 &&
      selected_img === null &&
      selected_img === undefined
    ) {
      return;
    }
    const arr_files = Array.from(files);
    const arr_exist_files = Array.from(exist_files);
    const arr_files_exist = Array.from(files_exist);
    const arr_previews = Array.from(previews);

    const file_for_remove = arr_files.filter(
      (file, file_index) => file_index === selected_img,
    );
    const filtered_files = arr_files.filter(
      (file, file_index) => file_index !== selected_img,
    );
    const filtered_exist_files = arr_exist_files.filter(
      (file, file_index) => file_index !== selected_img,
    );
    const filtered_files_exist = arr_files_exist.filter(
      (file, file_index) => file_index !== selected_img,
    );
    const filtered_previews = arr_previews.filter(
      (file, file_index) => file_index !== selected_img,
    );

    if (file_for_remove.length > 0) {
      console.log("file_for_remove > 0");
      set_removable_files((removable_files) => [
        ...removable_files,
        file_for_remove,
      ]);
    } else {
      console.log("filtered_files = 0");
      console.log("Файлы на удаление: Пусто");
    }
    console.log("filtered_files = ", filtered_files);
    console.log("filtered_exist_files = ", filtered_exist_files);
    console.log("filtered_files_exist = ", filtered_files_exist);
    console.log("filtered_previews = ", filtered_previews);
    console.log("file_for_remove = ", file_for_remove);
    set_previews([]);
    set_files(filtered_files);
    set_files_exist(filtered_files_exist);
  }

  useEffect(() => {
    if (removable_files.length > 0) {
      console.log("removable_files = ", removable_files);
    } else {
      console.log("remove_img пусто");
    }
  }, [removable_files]);

  function refresh_size() {
    // Получаем все нужные элементы
    if (document.body) {
      const body = document.querySelector(`.${cl.body}`);
      const fill = document.querySelector(`.${cl.fill}`);
      const img_add_btn = document.querySelector(`.${cl.img_add_btn}`);
      const grid = document.querySelector(`.${cl.grid}`);
      const cells = document.querySelectorAll(`.${cl.grid_cell}`);

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

  useEffect(() => {
    console.log("files-length = ", files.length);
    console.log("previews-length = ", previews.length);
    if (document.body) {
      refresh_size();
    }
  }, [files, previews]);

  // НУЖНО СДЕЛАТЬ ТАК, ЧТОБЫ ОТОБРАЖАЛСЯ ИЗМЕНЁННЫЙ ПОРЯДОК, НЕ ДЕФОЛТНЫЙ, ХОТЯ ПРИКОЛЬНО :D
  // ПЕРВАЯ ОТПРАВКА [1,2,3,4] ПОСЛЕ ИЗМЕНЕНИЯ [2,4,1,3] ОТОБРАЖАЕТСЯ В previews КАК [1,2,3,4] - ХЗ ПОЧЕМУ ТАК
  // (возможно из-за того что он ищет в папке с фотографиями и потом перебирает по их порядку, следовательно порядок будет одинаковый всегда,
  // нужно попробовать перебирать images и сравнивать с файлами из папки и совпадения выносить в отдельную переменную)

  async function change_post_data() {
    console.log("[change_post_data]");
    const token = localStorage.getItem("token");
    console.log("old_text = ", old_text);
    console.log("images = ", images);
    console.log("files = ", files);
    if (
      text === old_text &&
      files.length === 0 &&
      removable_files.length === 0 &&
      type !== "img" &&
      type !== "img_and_text"
    ) {
      return;
    }
    // удаление файлов с сервера

    // ДЛЯ ГРУППЫ
    if (!user_id && id && !for_current_mails) {
      if (removable_files.length > 0) {
        removable_files.forEach(async (rem_file) => {
          console.log("rem_file = ", rem_file);
          try {
            const response_remove = await axios.post(
              "/total_delete_img",
              {
                group_id: id,
                content_id: content_id,
                old_file: JSON.stringify(
                  rem_file[0]?.old_file?.data?.loaded_file,
                ),
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
          } catch (err) {
            console.error("Ошибка удаления файла: ", err);
          }
        });
      }
      if (type === "img") {
        // изображение

        // ПРЕДЗАГРУЗКА ФАЙЛОВ
        try {
          const uploaded_files = files.map((file, index) => {
            if (file) {
              console.log("file-to-load =", file);
              const formData = new FormData();
              formData.append("group_id", id);
              formData.append(
                "file",
                file?.type === "empty" ? JSON.stringify(file) : file,
              ); // передача либо объекта( кодировка + ) либо файла ( без кодировки )
              formData.append("file_index", index);
              const response = axios.post(
                "/pre_loader_files",
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
            }
          });
          const loaded_files = await Promise.all(uploaded_files);
          const filtered_loaded_files = loaded_files.filter(
            (file) => file !== undefined && file !== null && file !== "",
          );
          console.log("Предзагруженные файлы: ", filtered_loaded_files);
          if (!filtered_loaded_files) {
            return console.error("Не удалось подготовить файлы");
          }
          try {
            // замена или добавление уже исходных материалов контента
            console.log("файлы для отправки: ", files);
            const formDataChange = new FormData();
            formDataChange.append("new_row_files", JSON.stringify(files));
            formDataChange.append("group_id", id);
            formDataChange.append("content_id", content_id);
            formDataChange.append("type_content", "img");
            formDataChange.append(
              "files",
              JSON.stringify(filtered_loaded_files) || [],
            );
            console.log("оправка files: ", filtered_loaded_files);
            const response_change_content = await axios.post(
              "/change_content",
              formDataChange,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
            if (response_change_content?.data?.message) {
              console.log(response_change_content?.data?.message);
            }
            if (response_change_content?.data?.refresh) {
              set_files_exist([]);
              set_files([]);
              get_posts();

              try {
                // обновление через websocket
                ws_ref.current.send(
                  JSON.stringify({
                    type: "change_content_for_group",
                    content_id: content_id,
                    group_id: id,
                  }),
                );
                console.log(
                  "________________change_content (для группы)________________",
                );
              } catch (err) {
                console.error(
                  "(для группы) Ошибка отправки через websocket: ",
                  err,
                );
              }

              close();
            }
          } catch (err) {
            console.error("Ошибка: ", err);
          }
        } catch (err) {
          return console.error("Ошибка загрузки изображения!", err);
        }
      }
      if (type === "text") {
        // текст
        try {
          // ОТПРАВКА ПОСТА
          const formData_to_post = new FormData();
          formData_to_post.append("group_id", id);
          formData_to_post.append("text", text);
          formData_to_post.append("content_id", content_id);
          formData_to_post.append("type_content", "text");
          const response_send_post = await axios.post(
            "/change_content",
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
              get_posts();

              try {
                // обновление через websocket
                ws_ref.current.send(
                  JSON.stringify({
                    type: "change_content_for_group",
                    content_id: content_id,
                    group_id: id,
                  }),
                );
              } catch (err) {
                console.error(
                  "(для группы) Ошибка отправки через websocket: ",
                  err,
                );
              }

              close();
            }
          } else {
            console.log("Нет ответа от сервера");
          }
        } catch (err) {
          console.error("Ошибка: ", err);
        }
      }
      if (type === "img_and_text") {
        // файлы и текст

        // ПРЕДЗАГРУЗКА ФАЙЛОВ
        try {
          const uploaded_files = files.map((file, index) => {
            if (file) {
              console.log("file-to-load =", file);
              const formData = new FormData();
              formData.append("group_id", id);
              formData.append(
                "file",
                file?.type === "empty" ? JSON.stringify(file) : file,
              ); // передача либо объекта( кодировка + ) либо файла ( без кодировки )
              formData.append("file_index", index);
              formData.append("type_content", "img_and_text");
              const response = axios.post(
                "/pre_loader_files",
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
            }
          });
          const loaded_files = await Promise.all(uploaded_files);
          const filtered_loaded_files = loaded_files.filter(
            (file) => file !== undefined && file !== null && file !== "",
          );
          console.log("Предзагруженные файлы: ", filtered_loaded_files);
          if (!filtered_loaded_files) {
            return console.error("Не удалось подготовить файлы");
          }
          try {
            // замена или добавление уже исходных материалов контента
            console.log("файлы для отправки: ", files);
            const formDataChange = new FormData();
            formDataChange.append("new_row_files", JSON.stringify(files));
            formDataChange.append("group_id", id);
            formDataChange.append("text", text);
            formDataChange.append("content_id", content_id);
            formDataChange.append("type_content", "img_and_text");
            formDataChange.append(
              "files",
              JSON.stringify(filtered_loaded_files) || [],
            );
            console.log("оправка files: ", filtered_loaded_files);
            const response_change_content = await axios.post(
              "/change_content",
              formDataChange,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
            if (response_change_content?.data?.message) {
              console.log(response_change_content?.data?.message);
            }
            if (response_change_content?.data?.refresh) {
              set_files_exist([]);
              set_files([]);
              get_posts();

              try {
                // обновление через websocket
                if (
                  ws_ref.current !== null &&
                  ws_ref.current.readyState === 1
                ) {
                  ws_ref.current.send(
                    JSON.stringify({
                      type: "change_content_for_group",
                      content_id: content_id,
                      group_id: id,
                    }),
                  );
                  console.log(
                    "________________change_content (для группы)________________",
                  );
                }
              } catch (err) {
                console.error(
                  "(для группы) Ошибка отправки через websocket: ",
                  err,
                );
              }

              close();
            }
          } catch (err) {
            console.error("Ошибка: ", err);
          }
        } catch (err) {
          return console.error("Ошибка загрузки изображения!", err);
        }
      }
    }
    // ДЛЯ USER_PAGE
    else if (!for_current_mails) {
      if (removable_files.length > 0) {
        removable_files.forEach(async (rem_file) => {
          console.log("rem_file = ", rem_file);
          try {
            const response_remove = await axios.post(
              "/total_delete_img_for_user_page",
              {
                user_page_id: user_id,
                content_id: content_id,
                old_file: JSON.stringify(
                  rem_file[0]?.old_file?.data?.loaded_file,
                ),
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
          } catch (err) {
            console.error("Ошибка удаления файла: ", err);
          }
        });
      }
      if (type === "img") {
        // изображение

        // ПРЕДЗАГРУЗКА ФАЙЛОВ
        try {
          const uploaded_files = files.map((file, index) => {
            if (file) {
              console.log("[592]");
              console.log("file-to-load =", file);
              const formData = new FormData();
              formData.append("user_page_id", user_id);
              formData.append(
                "file",
                file?.type === "empty" ? JSON.stringify(file) : file,
              ); // передача либо объекта( кодировка + ) либо файла ( без кодировки )
              formData.append("file_index", index);
              const response = axios.post(
                "/pre_loader_files_for_user_page",
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
            }
          });
          const loaded_files = await Promise.all(uploaded_files);
          const filtered_loaded_files = loaded_files.filter(
            (file) => file !== undefined && file !== null && file !== "",
          );
          console.log("Предзагруженные файлы: ", filtered_loaded_files);
          if (!filtered_loaded_files) {
            return console.error("Не удалось подготовить файлы");
          }
          try {
            // замена или добавление уже исходных материалов контента
            console.log("файлы для отправки: ", files);
            const formDataChange = new FormData();
            formDataChange.append("new_row_files", JSON.stringify(files));
            formDataChange.append("user_page_id", user_id);
            formDataChange.append("content_id", content_id);
            formDataChange.append("type_content", "img");
            formDataChange.append(
              "files",
              JSON.stringify(filtered_loaded_files) || [],
            );
            console.log("оправка files: ", filtered_loaded_files);
            const response_change_content = await axios.post(
              "/change_content_user_page",
              formDataChange,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
            if (response_change_content?.data?.message) {
              console.log(response_change_content?.data?.message);
            }
            if (response_change_content?.data?.refresh) {
              set_files_exist([]);
              set_files([]);
              get_posts();
              close();
            }
          } catch (err) {
            console.error("Ошибка: ", err);
          }
        } catch (err) {
          return console.error("Ошибка загрузки изображения!", err);
        }
      }
      if (type === "text") {
        // текст
        try {
          // ОТПРАВКА ПОСТА
          const formData_to_post = new FormData();
          formData_to_post.append("user_page_id", user_id);
          formData_to_post.append("text", text);
          formData_to_post.append("content_id", content_id);
          formData_to_post.append("type_content", "text");
          const response_send_post = await axios.post(
            "/change_content_user_page",
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
              get_posts();
            }
          } else {
            console.log("Нет ответа от сервера");
          }
        } catch (err) {
          console.error("Ошибка: ", err);
        }
      }
      if (type === "img_and_text") {
        // файлы и текст

        // ПРЕДЗАГРУЗКА ФАЙЛОВ
        try {
          const uploaded_files = files.map((file, index) => {
            if (file) {
              console.log("file-to-load =", file);
              const formData = new FormData();
              formData.append("user_page_id", user_id);
              formData.append(
                "file",
                file?.type === "empty" ? JSON.stringify(file) : file,
              ); // передача либо объекта( кодировка + ) либо файла ( без кодировки )
              formData.append("file_index", index);
              formData.append("type_content", "img_and_text");
              const response = axios.post(
                "/pre_loader_files_for_user_page",
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
            }
          });
          const loaded_files = await Promise.all(uploaded_files);
          const filtered_loaded_files = loaded_files.filter(
            (file) => file !== undefined && file !== null && file !== "",
          );
          console.log("Предзагруженные файлы: ", filtered_loaded_files);
          if (!filtered_loaded_files) {
            return console.error("Не удалось подготовить файлы");
          }
          try {
            // замена или добавление уже исходных материалов контента
            console.log("файлы для отправки: ", files);
            const formDataChange = new FormData();
            formDataChange.append("new_row_files", JSON.stringify(files));
            formDataChange.append("user_page_id", user_id);
            formDataChange.append("text", text);
            formDataChange.append("content_id", content_id);
            formDataChange.append("type_content", "img_and_text");
            formDataChange.append(
              "files",
              JSON.stringify(filtered_loaded_files) || [],
            );
            console.log("оправка files: ", filtered_loaded_files);
            const response_change_content = await axios.post(
              "/change_content_user_page",
              formDataChange,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
            if (response_change_content?.data?.message) {
              console.log(response_change_content?.data?.message);
            }
            if (response_change_content?.data?.refresh) {
              set_files_exist([]);
              set_files([]);
              get_posts();
              close();
            }
          } catch (err) {
            console.error("Ошибка: ", err);
          }
        } catch (err) {
          return console.error("Ошибка загрузки изображения!", err);
        }
      }
    }
    // ДЛЯ CURRENT_MAILS
    else if (for_current_mails) {
      if (removable_files.length > 0) {
        removable_files.forEach(async (rem_file) => {
          console.log("rem_file = ", rem_file);
          console.log("current_images = ", images);
          console.log("other_id = ", other_id);
          console.log("for_current_mails = ", for_current_mails);
          console.log(
            "content_id_for_current_mails = ",
            content_id_for_current_mails,
          );
          try {
            console.log("+++++ УДАЛЕНИЕ ИЗОБРАЖЕНИЙ...");
            const response_remove = await axios.post(
              "/total_delete_img_for_current_mails",
              {
                my_id: my_id,
                other_id: other_id,
                content_id: content_id_for_current_mails,
                for_current_mails: for_current_mails || false,
                old_file: JSON.stringify(rem_file),
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
            console.log("+++++ УДАЛЕНИЕ ИЗОБРАЖЕНИЙ ЗАВЕРШЕНО!");
          } catch (err) {
            console.error("Ошибка удаления файла: ", err);
          }
        });
      }
      if (type === "img") {
        // изображение

        // ПРЕДЗАГРУЗКА ФАЙЛОВ
        try {
          const uploaded_files = files.map((file, index) => {
            if (file) {
              console.log("[782]");
              console.log("file-to-load =", file);
              const formData = new FormData();
              formData.append("my_id", my_id);
              formData.append("other_id", other_id);
              formData.append(
                "file",
                file?.type === "empty" ? JSON.stringify(file) : file,
              ); // передача либо объекта( кодировка + ) либо файла ( без кодировки )
              formData.append("file_index", index);
              const response = axios.post(
                "/pre_loader_files_for_current_mails",
                formData,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );
              if (response) {
                // КАК-ТО СДЕЛАТЬ ПРОВЕРКУ СТАТУСА ПРОМИСА. Promise?.status НЕ РАБОТАЕТ! НЕ ПОНЯЛ
                return response;
              } else {
                console.log("Загрузка файла не удалась. ");
              }
            }
          });
          const loaded_files = await Promise.all(uploaded_files);
          const filtered_loaded_files = loaded_files.filter(
            (file) => file !== undefined && file !== null && file !== "",
          );
          console.log("Предзагруженные файлы: ", filtered_loaded_files);
          if (!filtered_loaded_files) {
            return console.error("Не удалось подготовить файлы");
          }
          try {
            // замена или добавление уже исходных материалов контента
            console.log("файлы для отправки: ", files);
            const formDataChange = new FormData();
            formDataChange.append("new_row_files", JSON.stringify(files));
            formDataChange.append("user_page_id", user_id);
            formDataChange.append("content_id", content_id_for_current_mails);
            formDataChange.append("type_content", "img");
            formDataChange.append(
              "files",
              JSON.stringify(filtered_loaded_files) || [],
            );
            console.log("оправка files: ", filtered_loaded_files);
            const response_change_content = await axios.post(
              "/change_content_for_current_mails",
              formDataChange,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
            if (response_change_content?.data?.message) {
              console.log(response_change_content?.data?.message);
            }
            if (response_change_content?.data?.refresh) {
              console.log("[849] ___REFRESH___");

              set_files_exist([]);
              set_files([]);
              get_posts();
              close();
              scroll_to_it_after_changed(content_id_for_current_mails);

              try {
                // обновление через websocket
                ws_ref.current.send(
                  JSON.stringify({
                    type: "change_content_for_mail",
                    for: curr_user,
                  }),
                );
              } catch (err) {
                console.error(
                  "(для группы) Ошибка отправки через websocket: ",
                  err,
                );
              }
            }
          } catch (err) {
            console.error("Ошибка: ", err);
          }
        } catch (err) {
          return console.error("Ошибка загрузки изображения!", err);
        }
      }
      if (type === "text") {
        // текст
        try {
          // ОТПРАВКА ПОСТА
          const formData_to_post = new FormData();
          formData_to_post.append("user_page_id", user_id);
          formData_to_post.append("text", text);
          formData_to_post.append("content_id", content_id_for_current_mails);
          formData_to_post.append("type_content", "text");
          const response_send_post = await axios.post(
            "/change_content_for_current_mails",
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
              console.log("[894] ____REFRESH___");
              // обновление контента
              set_files_exist([]);
              set_files([]);
              get_posts();
              close();
              scroll_to_it_after_changed(content_id_for_current_mails);

              try {
                // обновление через websocket
                ws_ref.current.send(
                  JSON.stringify({
                    type: "change_content_for_mail",
                    for: curr_user,
                  }),
                );
              } catch (err) {
                console.error(
                  "(для группы) Ошибка отправки через websocket: ",
                  err,
                );
              }
            }
          } else {
            console.log("Нет ответа от сервера");
          }
        } catch (err) {
          console.error("Ошибка: ", err);
        }
      }
      if (type === "img_and_text") {
        // файлы и текст

        // ПРЕДЗАГРУЗКА ФАЙЛОВ
        try {
          const uploaded_files = files.map((file, index) => {
            if (file) {
              console.log("[878] file-to-load =", file);
              const formData = new FormData();
              formData.append("my_id", my_id);
              formData.append("other_id", other_id);
              formData.append(
                "file",
                file?.type === "empty" ? JSON.stringify(file) : file,
              ); // передача либо объекта( кодировка + ) либо файла ( без кодировки )
              formData.append("file_index", index);
              const response = axios.post(
                "/pre_loader_files_for_current_mails",
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
            }
          });
          const loaded_files = await Promise.all(uploaded_files);
          const filtered_loaded_files = loaded_files.filter(
            (file) => file !== undefined && file !== null && file !== "",
          );
          console.log("[910] Предзагруженные файлы: ", filtered_loaded_files);
          if (!filtered_loaded_files) {
            return console.error("Не удалось подготовить файлы");
          }
          try {
            // замена или добавление уже исходных материалов контента
            console.log("файлы для отправки: ", files);

            console.log("___ new_row_files = ", JSON.stringify(files) || []);
            console.log("___ user_page_id = ", user_id);
            console.log("___ text = ", text);
            console.log("___ content_id = ", content_id_for_current_mails);
            console.log("___ type_content = img_and_text");
            console.log(
              "___ files = ",
              JSON.stringify(filtered_loaded_files) || [],
            );

            const formDataChange = new FormData();
            formDataChange.append("new_row_files", JSON.stringify(files) || []);
            formDataChange.append("user_page_id", user_id);
            formDataChange.append("text", text);
            formDataChange.append("content_id", content_id_for_current_mails);
            formDataChange.append("type_content", "img_and_text");
            formDataChange.append(
              "files",
              JSON.stringify(filtered_loaded_files) || [],
            );

            console.log("оправка files: ", filtered_loaded_files, " ...");
            try {
              console.log("1");
              const response_change_content = await axios.post(
                "/change_content_for_current_mails",
                formDataChange,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );
              console.log("2");
              if (response_change_content) {
                console.log(
                  "response_change_content = ",
                  response_change_content,
                );
              }
              console.log("отправка файлов прошла успешно!");
              if (response_change_content?.data?.message) {
                console.log(response_change_content?.data?.message);
              }
              if (response_change_content?.data?.refresh) {
                console.log("[975]_REFRESH_");
                set_files_exist([]);
                set_files([]);
                get_posts();
                close();
                scroll_to_it_after_changed(content_id_for_current_mails);

                try {
                  if (ws_ref.current.readyState === 1) {
                    // обновление через websocket
                    ws_ref.current.send(
                      JSON.stringify({
                        type: "change_content_for_mail",
                        for: curr_user,
                      }),
                    );
                  }
                } catch (err) {
                  console.error(
                    "(для группы) Ошибка отправки через websocket: ",
                    err,
                  );
                }
              }
            } catch (err) {
              console.error("Ошибка изменения: ", err);
              throw err;
            }
          } catch (err) {
            console.error("Ошибка: ", err);
          }
        } catch (err) {
          return console.log("Ошибка загрузки изображения!", err);
        }
      }
    }
  }

  function change_place_img(file, index, selected_cell) {
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
    if (!cell_down || delete_button_down) return;
    set_cell_down(false);
    set_pos_down(false);
    if (frame_selected_preview.current)
      frame_selected_preview.current.style.display = "none";
    const cursor_x = e.clientX;
    const cursor_y = e.clientY;
    const previews_blocks = document.querySelectorAll(`.${cl.grid_cell}`);
    let target_index = -1;
    Array.from(previews_blocks).forEach((preview, index) => {
      if (preview.children[1]) preview.children[1].style.display = "";
      const rect = preview.getBoundingClientRect();
      if (
        cursor_x > rect.left &&
        cursor_x < rect.right &&
        cursor_y > rect.top &&
        cursor_y < rect.bottom
      )
        target_index = index;
    });
    const source_index = selected_preview?.index;
    if (
      target_index < 0 ||
      source_index == null ||
      target_index === source_index
    )
      return;

    const move_item = (items) => {
      if (source_index >= items.length || target_index >= items.length)
        return items;
      const next = [...items];
      const [item] = next.splice(source_index, 1);
      next.splice(target_index, 0, item);
      return next;
    };
    set_files((current) => move_item(current));
    set_previews((current) => move_item(current));
    set_files_exist((current) => move_item(current));
  }

  function handler_mouse_move(e) {
    if (pos_down && cell_down && !delete_button_down) {
      const delete_preview = frame_selected_preview.current;
      if (!delete_preview) {
        return;
      }
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

      const previews_blocks = document.querySelectorAll(`.${cl.grid_cell}`);
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
          set_pos_down(false);
          set_cell_down(false);
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
  }, [frame_selected_preview, cell_down, delete_button_down, pos_down]);

  function delete_button_is_enter() {
    set_delete_button_down(true);
  }
  function delete_button_is_up() {
    set_delete_button_down(false);
  }

  useEffect(() => {
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

  return (
    <div className={cl.form}>
      {cell_down && (
        <div ref={frame_selected_preview} className={cl.frame_selected_preview}>
          <img src={selected_preview?.src} alt="картинка" />
        </div>
      )}
      <div className={cl.fill}>
        <div className={cl.body}>
          <div style={{ display: "none" }}>
            {/* ВАРИАНТ 1 */}
            {(type === "img" || type === "all") && (
              <div>
                <div className={cl.img}>Изображения</div>
                <div className={cl.img_row}>
                  {/* максимум 6 изображений */}
                  {previews.length > 0 &&
                    previews.map((file, index) => (
                      <div key={index} className={cl.img_row_col}>
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
                <div
                  className={cl.img_add_btn}
                  onClick={() => {
                    add_img();
                  }}
                >
                  Добавить
                </div>
              </div>
            )}
          </div>

          {/* ВАРИАНТ 2 */}
          {type === "img" ? (
            <div>
              <div className={cl.img}>Изображения</div>
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
                      className={cl.grid_cell}
                      onMouseDown={(e) => {
                        change_place_img(file, index, e.currentTarget);
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
          ) : type === "text" ? (
            <div className={cl.text}>
              <div>Новость</div>
              <textarea
                ref={textarea_ref}
                className={cl.textarea}
                value={text}
                onChange={(e) => {
                  set_text(e.target.value);
                }}
                maxLength={300}
              ></textarea>
            </div>
          ) : (
            type === "img_and_text" && (
              <div>
                <div className={cl.text}>
                  <div>Новость</div>
                  <textarea
                    ref={textarea_ref}
                    className={cl.textarea}
                    value={text}
                    onChange={(e) => {
                      set_text(e.target.value);
                    }}
                    maxLength={300}
                  ></textarea>
                </div>
                <div className={cl.img}>Изображения</div>
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
                        className={cl.grid_cell}
                        onMouseDown={(e) => {
                          change_place_img(file, index, e.currentTarget);
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
            )
          )}

          <div className={cl.send}>
            <button
              type="button"
              className={cl.send_in}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                change_post_data();
              }}
            >
              Применить изменения
            </button>
          </div>
        </div>
        <div className={cl.fon} onClick={close_this}>
          {/* fon */}
        </div>
        <div className={cl.mini_form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
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
        </div>
      </div>
    </div>
  );
};

export default Form_Change_Record;
