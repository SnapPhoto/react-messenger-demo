import React, {useRef, useState, useEffect} from 'react';
import axios from 'axios';
import cl from './voice.module.css';

export const Voice_Message = ({voice_recorded, set_voice_recorded, recording_voice, set_recording_voice, voice_sended, set_voice_sended, ws_ref}) => {
  const [ is_recording, set_is_recording ] = useState(false);
  const audio_url_ref = useRef(null);
  const stream_ref = useRef(null);
  const audio_blob_ref = useRef(null);
  const media_recorder_ref = useRef(null);
  const [ chunks, set_chunks ] = useState([]);
  const [audio_url, set_audio_url] = useState(null);

  const [timer, set_timer] = useState(10);
  const timer_ref = useRef(null);

  const [ test_uploaded_audio, set_test_uploaded_audio ] = useState(null);
  const [ test_voice_url, set_test_voice_url ] = useState(null); // test_voice_url = возвращённый сервером файл для проверки после сохранения на сервере

  function timer_interval(){
    set_timer(timer => (timer - 1 ));
    return ()=>{
      clearInterval()
    }
  };

  useEffect(()=>{
    if( timer < 0 ){
      stop_record();
    };
  },[timer])

  async function start_record(){
    clear_data_record();
    console.log('START RECORD!')
    const timerInterval = setInterval(timer_interval,1000);
    timer_ref.current = timerInterval;
    try{
      set_recording_voice(true);
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      stream_ref.current = stream;
      const media_recorder = new MediaRecorder(stream);
      media_recorder.start();

      media_recorder.ondataavailable = (e) => {
        if( e.data.size > 0 ){
          set_chunks(chunks => [...chunks, e.data]);
          console.log('[chunks] Добавлено ', e.data.size ,' байт');
        }
        else{
          console.log('e.data.size <= 0');
          set_recording_voice(false);
          set_timer(10);
        }
      }
    }
    catch(err){
      console.error('Ошибка записи аудио: ', err);
      set_recording_voice(false);
      clear_data_record();
    }
    return(()=>{
      clearInterval(timerInterval);
    })
  };

  useEffect(()=>{
    if( chunks.length > 0 ){
      const audio_blob = new Blob(chunks, {type: 'audio/webm'});
      if( audio_blob ){
        const audio_url = URL.createObjectURL(audio_blob);
        if( audio_url ){
          audio_url_ref.current = audio_url;
          set_audio_url(audio_url);
          // send_audio_to_server(audio_blob);
          if( !voice_recorded ){
            set_voice_recorded(audio_blob);
          }
        }
        else{
          console.log('[X] audio_url пуст')
          set_recording_voice(false);
        }
      }
    }
  },[chunks]);

  async function stop_record(){
    console.log('STOP RECORD!')
    clearInterval(timer_ref.current);
    try{
      if( media_recorder_ref.current !== null ){
        media_recorder_ref.current.stop();
      };
      if( stream_ref.current !== null ){
        stream_ref.current.getTracks().forEach(track => track.stop());
        set_recording_voice(false);
        set_timer(10);
      };
    }
    catch(err){
      console.error('Ошибка остановки записи аудио: ', err);
      set_recording_voice(false); // или не стоит? 
      clear_data_record()
    }
  };

  function clear_data_record(){
    console.log('CLEAR DATA RECORD!');
    if( stream_ref.current !== null ){
      stream_ref.current.getTracks().forEach(track => track.stop());
      set_recording_voice(false);
      set_timer(10);
    };
    stream_ref.current = null;
    audio_url_ref.current = null;
    media_recorder_ref.current = null;
    set_chunks([]);
    set_audio_url(null);
    set_recording_voice(false);
    set_voice_recorded(null);
    set_test_uploaded_audio(null);
  }

  useEffect(()=>{
    if( voice_sended ){
      clear_data_record();
      set_voice_sended(false);
    }
  },[voice_sended])

  // async function send_audio_to_server(BLOB){
  //   console.log('send_audio_to_server');
  //   try{
  //     const formData = new FormData();
  //     formData.append('audio', BLOB, 'recording-webm');
  //     const response = await axios.post('http://localhost:8080/send_voice_message', formData, {});
  //     if( response?.data?.message ){
  //       console.log('Сервер вернул ответ: ', response?.data?.message);
  //     };
  //     if( response?.data?.audio ){
  //       console.log('audio = ', response?.data?.audio);
  //       set_test_uploaded_audio(null);
  //       set_test_uploaded_audio(response?.data?.audio?.name || null);
  //     }
  //     else{
  //       console.log('Голосовой записи не отправлено/не принято')
  //     }
  //   }
  //   catch(err){
  //     console.error('Ошибка отправки аудио на сервер: ', err);
  //   }
  // }

  useEffect(()=>{
    if( audio_url ){
      console.log('audio_url = ', audio_url);
    };
    if( test_uploaded_audio ){
      console.log('test_uploaded_audio = ', test_uploaded_audio);
      const voice_url = `http://localhost:8080/voice/${test_uploaded_audio}`;
      if( voice_url ){
        console.log('test_voice_url = ', voice_url)
        set_test_voice_url(voice_url);
      }
    };
  },[audio_url, test_uploaded_audio])

  return (
    <div className={cl.voice_block}>
      <div className={cl.voice_bottons}>
        <div className={cl.buttons}>
          {!is_recording
          ?
            !audio_url &&
            <button className={cl.button} onClick={()=>{set_is_recording(true); start_record()}}>Записать</button>
          :
            !audio_url &&
            <button className={cl.button} onClick={()=>{set_is_recording(false); stop_record()}}>Остановить</button>
          }
          {audio_url &&
            <button className={cl.button} onClick={()=>{clear_data_record()}}>Очистить</button>
          }
          {!audio_url && is_recording &&
            <div className={cl.timer}>
              {timer >=0 && timer || '0'}
            </div>
          }
        </div>
        <div className={cl.voice_audio}>
          {audio_url  &&
            <audio className={cl.audio} controls src={audio_url}>Ошибка аудио. Запись не поддерживается или не загружена</audio>
          }
        </div>
      </div>
    </div>
  )
};

export default Voice_Message;