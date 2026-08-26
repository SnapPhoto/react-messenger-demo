# react-messenger-demo

Мессенджер на стеке React + Fastify + @fastify/websocket. Реализована загрузка файлов через FormData/axios

## Как запустить

1. `npm install`
2. Создай файл `.env` на основе `.env.example` - Заполни следующее:
   JWT_SECRET_FIRST - секретный пароль
   JWT_DBCONNECT - подключение к mongoDB по типу mongodb+srv://...
   JWT_NODEMAILER_HOST - smtp сервис по типу smtp.gmail.com
   JWT_NODEMAILER_PORT - порт подключения
   JWT_NODEMAILER_SECURE - true, false (записит от порта)
   JWT_NODEMAILER_USER - логин от SMTP сервера
   JWT_NODEMAILER_PASSWORD - пароль от SMTP сервера
   JWT_NODEMAILER_FROM - почта, с которой будет произведена рассылка писем (желательно такой же как и логин от SMTP)

3. Запусти сервер: node server.js
4. Запусти проект: npm start
