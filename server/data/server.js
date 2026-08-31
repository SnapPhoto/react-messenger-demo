const fastify = require ('fastify')({
	trustProxy: true, // включение proxy для нормализации ip клиента websocket
});
const cors = require('@fastify/cors');
const fastify_static = require('@fastify/static');
const dotenv = require ('dotenv').config({
	path: './.env',
	// debug: true,
});
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const fastifywebsocket = require('@fastify/websocket');
const { addClient, removeClient, sendMessage, getClientsSize } = require('./websocket/tools.js');

//тест голосового
const ffmpeg = require('fluent-ffmpeg'); // ПОД ВОПРОСОМ!
//конец тест голососого

const User_Schema = require('../schemas/user');
const Message_Schema = require('../schemas/message.js');
const Group_Schema = require('../schemas/group.js');
const Post_Group_Schema = require('../schemas/post_group.js');
const User_Page_Schema = require('../schemas/user_page.js');
const Post_User_Page_Schema = require('../schemas/post_user_page.js');
const Invites_Schema = require('../schemas/invites.js');
const Favourites_Schema = require('../schemas/favourites.js');
const Posts_For_Main_Page_Schema = require('../schemas/posts_for_main_page.js');

const connect_db = require('./connect_db');
const nodemailer = require('nodemailer'); //нужно кстати его настроить :D фигли стоит без дела
const Secure_Code_Schema = require('../schemas/secure_code.js');

// для загрузки файлов
const fs = require('fs/promises');
if( !fs ){
	console.log('fs не подключен')
}
const path = require('path');
if( !path ){
	console.log('path не подключен')
}

//регистрация окружения
async function register_cors(){
	try{
		//регистрация @fastify/cors...
		console.log('Регистрация @fastify/cors...');
		await fastify.register(cors, {
			origin: '*',
			credentials: true,
		})
		console.log('@fastify/cors зарегистрирован!');
		await regFastifyMultipart();
	}
	catch(err){
		console.log('Ошибка регистрации @fastify/cors. ', err);
		process.exit(1);
	}
};

// ДЛЯ ОТПРАВКИ ФАЙЛОВ
const regFastifyMultipart = async ()=>{
	try{
		console.log('Регистрация @fastify/multipart...')
		await fastify.register(require('@fastify/multipart'), {
			attachFieldsToBody: true,
			limits: {
				fileSize: 10 * 1024 * 1024,
				files: 1,
			}
		});
		console.log('@fastify/multipart зарегистрирован');
		await register_fastify_static_for_voice();
	}
	catch(err){
		console.log('Ошибка регистрации @fastify/multipart');
		process.exit(1);
	}
}

//регистрация @fastify/static для голосовых
async function register_fastify_static_for_voice(){
	try{
		//Проверка на существование папки для голосовых
		try{
			const folder_path = path.join(__dirname, '../../src/audio_files');
			const folder_exist = await fs.access(folder_path).then(()=>true).catch((err)=>false);
			if( !folder_exist ){
				console.log('Папки для голосовых не существует');
				console.log('Создание папки для голосовых...');
				await fs.mkdir(folder_path);
				console.log('Папка для голосовых успешно создана');
			}
			else{
				console.log('Папка для voice существует!');
			}
		}
		catch(err){
			console.log('Не удалось создать папку для голосовых. Ошибка: ', err);
		};
		console.log('Регистрация @fastify/static...');
		await fastify.register(fastify_static, {
			root: path.join(__dirname, '../../src/audio_files'), // путь к папке для голосовых
			prefix: '/voice/', // частичка пути в http:// (пример: http://localhost:8080/ voice /будущее название файла)
			maxAge: '30m', // время хранения файла браузером, чтобы не запрашивать повторно с сервера
			decorateReply: true,
		});
		console.log('@fastify/static успешно зарегистрирован!')
		await register_fastifywebsocket();
		
	}
	catch(err){
		console.log('Ошибка регистрации @fastify/static: ', err);
		process.exit(1);
	}
};


async function register_fastifywebsocket(){
	try{
		console.log('Регистрация @fastify/websocket...');
		await fastify.register(fastifywebsocket)
		console.log('@fastify/websocket успешно зарегистрирован!');
		await route_websocket();
	}
	catch(err){
		console.log('Ошибка регистрации @fastify/websocket: ', err);
		process.exit(1);
	}
};

async function route_websocket(){
	try{
		console.log('[websocket] Включение роута...');
		fastify.get('/ws', {websocket: true}, (socket, request) => {
			const ip = request?.ip || request?.headers['x-forwarded-for'] || undefined;
			if( ip ){
				console.log(`[websocket] Клиент [ip = ${ip}] подключился!`);
				addClient(socket);
				console.log(`[websocket] Всего клиентов: ${getClientsSize()}`);

				socket.on('message', (data) => {
					console.log(`[websocket] Клиент [ip = ${ip}] отправил сообщение: ${data}`);
					sendMessage(data)
				});
				socket.on('error', (err) => {
					console.log(`[websocket] Клиент [ip = ${ip}] выдал ошибку: ${err}`);
					removeClient(socket)
				});
				socket.on('close', () => {
					console.log(`[websocket] Клиент [ip = ${ip}] отключился`);
					removeClient(socket)
					console.log(`[websocket] Клиентов осталось: ${getClientsSize()}`);
				});
			}
			else{
				console.log('[websocket] Не удалось определись ip клиента');
				removeClient(socket)
			}
		});
	}
	catch(err){
		console.log('[websocket] Ошибка: ', err);
		process.exit(1);
	}
};


(async () => {
	await register_cors();
	await connect_db();
	await Start();
})()













fastify.post('/write_image', async (request, reply) => {
	const file = request.body.file;
	if( !file ){
		console.log('Ошибка: ФАЙЛ НЕ ПЕРЕДАН НА СЕРВЕР');
		return reply.send({error: 'Ошибка:  ФАЙЛ НЕ ПЕРЕДАН НА СЕРВЕР'})
	}
	try{
		const fsprom = require('fs/promises');
		if(!fsprom){
			console.log('Ошибка FS_PROMISES');
			return reply.send({error: 'Ошибка FS_PROMISES'})
		};
		const pathh = require('path');
		if(!pathh){
			console.log('Ошибка PATHH')
			return reply.send({error: 'Ошибка PATHH'})
		};
		const folder = path.join(__dirname, '../../images/max');
		const folder_exist = await fs.access(folder)
		.then(()=>{true})
		.catch((err)=>{false});
		console.log(`Папка существует? ${folder_exist}`);
		if( folder_exist ){
			const file_ext = path.extname(file.filename);
			const file_name = `${Date.now()}-${file_ext}`;
			const file_path = path.join(folder, file_name);

			await fs.writeFile(file_path, await file.toBuffer());
			console.log('Файл успешно сохранён!');

			return reply.send(
				{
					message: 'Файл успешно сохранён',
					refresh: true,
				}
			)
		}
	}
	catch(err){
		console.log('Ошибка получения фотографий')
		return reply.send({error: 'Ошибка получения фотографий'});
	};
});

fastify.post('/account/register', async (request, reply) => {
	const data = request.headers;
	if( !data ){
		console.log('/account/register - Данные не переданы');
		return reply.send({error: 'Данные не переданы'});
	};
	const name = data.name;
	const pass = data.pass;
	const dbl_pass = data.dbl_pass;
	const email = data.email;
	const default_avatar = path.join(__dirname, '../../images/default/default_avatar/empty.jpg');
	if( !default_avatar ){
		console.log('Ошибка. Не могу найти ../default_avatar/empty.jpg');
		return;
	};

	if( !name ){
		console.log('/account/register - Имя не передано', name);
		return reply.send({error: 'Имя не передано'});
	};
	if( !pass ){
		console.log('/account/register - Пароль не передан', pass);
		return reply.send({error: 'Пароль не передан'});
	};
	if( !dbl_pass ){
		console.log('/account/register - Проверочный пароль не передан', dbl_pass);
		return reply.send({error: 'Проверочный пароль не передан'});
	};
	if( pass !== dbl_pass ){
		console.log('/account/register - Пароли не совпадают');
		return reply.send({error: 'Пароли не совпадают'});
	};
	try{
		const user_exist = await User_Schema.find({email: email});
		if( user_exist.length > 0 ){
			console.log('/account/register - Пользователь с таким Email уже зарегистрирован!');
			return reply.send({error: 'Пользователь с таким Email уже зарегистрирован!'});
		}
	}
	catch(err){
		return reply.status(401).send({error: 'Ошибка регистрации: ', err});
	}
	const new_password = await bcrypt.hash(pass, 10);
	if( !new_password ){
		console.log('/account/register - Пароль не зашифрован');
		return reply.send({error: 'Пароль не зашифрован'});
	}
	const new_user = new User_Schema({
		name: name,
		pass: new_password,
		email: email,
		profil_avatar: `${Date.now()}_-_empty.jpg`,
	});
	try{
		await new_user.save();
		console.log(`[СЕРВЕР]: Пользователь [ ${name} ] зарегистрировался!`);
	}
	catch(err){
		console.log('/account/register - Ошибка регистрации: ', err);
		return reply.send({error: `Ошибка регистрации: ${err}`});
	};
	//
	// поиск созданного провиля
	const user = await User_Schema.findOne({email: email});
	if( !user ){
		console.log('Не удалось найти пользователя: ', err);
		return reply.send({error: 'Не удалось найти пользователя:  ', err});
	}
	//
	const default_img_path = '../../src/images/default/default_avatar/empty.jpg';
	const default_path = path.join(__dirname, default_img_path);
	const new_img_path = path.join(__dirname, '../../src/images/profils/');
	const new_img_name = `${Date.now()}_-_empty.jpg`;
	const new_full_img_path = path.join(new_img_path, new_img_name);
	// копирование дефолтной фотки
	try{
		await fs.copyFile(default_img_path, new_full_img_path);
	}
	catch(err){
		console.log('Ошибка копирования дефолтной аватарки: ', err);
		return reply.send({error: 'Ошибка копирования дефолтной аватарки: ',err});
	}
	// заменяем данные
	try{
		await User_Schema.updateOne({_id: user._id},{
			$set: {
				profil_avatar: new_img_name,
			}
		})
	}
	catch(err){
		console.log('Ошибка установки дефолтной аватарки: ', err);
		return reply.send({error: 'Ошибка установки дефолтной аватарки: ', err});
	}
	// установка данных страницы пользователя (user_page)
	try{
		const user_page = new User_Page_Schema({
			page_id: user?._id,
			posts: [],
		});
		await user_page.save();
		console.log('Данные страницы пользователя установлены');
	}
	catch(err){
		console.log('Ошибка установки данных страницы пользователя (user_page): ', err);
		return reply.send({error: 'Ошибка установки данных страница пользователя (user_page): ', err});
	}
	//
	return reply.send({
		message: 'Вы успешно зарегистрировались!',
		register: true,
		user_id: user?._id,
	});
});

fastify.post('/account/login', async (request, reply) => {
	const login_data = request.headers;
	if( !login_data ){
		console.log('/account/login - Данные не переданы');
		return reply.status(400).send({error: 'Данные не переданы'});
	};
	const email = login_data.email;
	const pass = login_data.pass;
	if( !email || !pass ){
		console.log('/account/login - Ошибка данных');
		return reply.status(400).send({error: 'Ошибка данных'});
	};
	try{
		const find_user = await User_Schema.findOne({email});
		if( !find_user ){
			console.log('/account/login - Не верный логин или пароль');
			return reply.status(400).send({error: 'Не верный логин или пароль'});
		};
		const find_pass = find_user.pass;
		const is_match_passwords = await bcrypt.compare(pass, find_pass);
		if( !is_match_passwords ){
			console.log('/account/login - Неверный логин или пароль');
			return;
		}
		const id = find_user._id.toString();
		const token = await jwt.sign(
			{id: id, email: email, first_token: true},
			process.env.JWT_SECRET_FIRST,
			{expiresIn: '4h'},
		);
		if( !token ){
			console.log('/account/login - Ошибка создания токена');
			return;
		};
		console.log('\n \n/account/login - Вы авторизовались! \n [Токен]: ',token);
		return reply.send({
			message: 'Вы авторизовались!',
			token,
			login: true,
			my_id: find_user?._id,
		});

	}
	catch(err){
		console.log('/account/login - Ошибка авторизации: ', err);
		return reply.status(400).send({error: 'Ошибка авторизации: ', err});
	}
});

fastify.post('/account/logout', async (request,reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(401).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(401).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(401).send({error: 'Токен не передан'});
	}
	try{
		const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
		if( !decoded ){
			return reply.status(401).send({error: 'Токен не расшифрован. Выход не возможен'});
		};
		const email = decoded.email;
		if( !email ){
			return reply.status(401).send({error: 'Пользователь не распознан. Выход не возможен'});
		};
		const user = await User_Schema.findOne({email});
		if( !user ){
			return reply.status(401).send({error: 'Пользователь не существует. Выход не возможен'});
		};
		if( user ){
			await User_Schema.updateOne({email}, {$set: {last_activity: Date.now()}});
		};
		return reply.send({message: 'logout'})
	}
	catch(err){
		return reply.status(401).send({error: err});
	}
});

fastify.post('/account/delete_account', async (request, reply) => {

});

fastify.post('/account/verify', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		console.log('-')
		return reply.status(401).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(401).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(401).send({error: 'Токен не передан'});
	}

	try{
		const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
		if( !decoded ){
			return reply.status(401).send({error: 'Не удалось расшифровать полученный токен [1]'});
		};
		const email = decoded.email;
		if( !email ){
			return reply.status(401).send({error: 'Email не обнаружен'});
		};
		const user = await User_Schema.findOne({email});
		if( !user ){
			return reply.status(401).send({
				error: 'Данного пользователя не существует',
				logout: true,
			})
		};
		return reply.send({
			message: 'Токен валиден',
			decoded: decoded,
			exp: decoded.exp,
		})
	}
	catch(err){
		return reply.status(401).send({error: err});
	}
});


fastify.post('/main/add_friend', async (request, reply) => {
	const raw_token = request.headers.authorization; // мой токен
	const people_id = request.headers.people_id; // его id
	if( !raw_token || !people_id){
		return reply.status(401).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(401).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(401).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	}
	const email = decoded.email;
	if( !email ){
		return reply.status(401).send({error: 'Ошибка получения email'})
	}
	try{
		const user = await User_Schema.findOne({email});
		if( !user ){
			return reply.status(401).send({
				error: 'Ваш аккаунт не найден! Вы кто???',
				exit: true,
			});
		};
		const current_people = await User_Schema.findOne({_id: people_id});
		if( !current_people ){
			return reply.status(401).send({error: 'Пользователь не найден'});
		};

		if (current_people.waiting_add_friends.some(id => id.toString() === user._id.toString())) {
		    return reply.send({ error: 'Запрос уже отправлен!' });
		};

		// мой 
		await User_Schema.updateOne(
			{_id: user._id}, 
			{$push: {
				waiting_add_friends: people_id,
			}},
		);
		// его
		await User_Schema.updateOne(
			{_id: people_id}, 
			{$push: {
				waiting_confirm_friends: user._id.toString(),
			}},
		);
		return reply.send({message: 'Запрос на дружбу отправлен'});
	}
	catch(err){
		return reply.status(401).send({error: 'Не удалось добавить друга. Ошибка: ', err})
	}
});


fastify.post('/main/cancel_add_friend', async (request, reply) => {
	const raw_token = request.headers.authorization; // мой токен
	const people_id = request.headers.people_id; // id нажатого
	if( !raw_token || !people_id){
		return reply.status(401).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(401).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(401).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	}
	const email = decoded.email;
	if( !email ){
		return reply.status(401).send({error: 'Ошибка получения email'})
	}
	try{
		const user = await User_Schema.findOne({email});
		if( !user ){
			return reply.status(401).send({
				error: 'Ваш аккаунт не найден! Вы кто???',
				exit: true,
			});
		};
		const current_people = await User_Schema.findOne({_id: people_id}); // пользователь (id) у которого очищаем 'waiting_confirm_friends'
		if( !current_people ){
			return reply.status(401).send({error: 'Пользователь не найден'});
		};

		// очистка 'waiting_add_friends' у себя
		await User_Schema.updateOne(
			{_id: user._id}, 
			{$pull: {
				waiting_add_friends: people_id,
			}},
		);

		// очитска 'waiting_confirm_friends' у другого пользователя
		await User_Schema.updateOne(
			{_id: people_id}, 
			{$pull: {
				waiting_confirm_friends: user._id.toString(),
			}},
		);

		return reply.send({message: 'Запрос на дружбу отменён'});
	}
	catch(err){
		return reply.status(401).send({error: 'Не удалось добавить друга. Ошибка: ', err})
	}
});


fastify.post('/main/get_await_confirm_friends', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(401).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(401).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(401).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	}
	const email = decoded.email;
	if( !email ){
		return reply.status(401).send({error: 'Ошибка получения email'})
	}
	try{
		const user = await User_Schema.findOne({email});
		if( !user ){
			return reply.status(401).send({
				error: 'Ваш аккаунт не найден в базе. Вы кто?',
				exit: true,
			});
		};
		const await_confirm = user.waiting_confirm_friends;
		if( await_confirm.length > 0 ){
			let users = [];

			for( const id of await_confirm ){
				await get_full(id)
			}

			async function get_full(id){
				let user_data = await User_Schema.findOne({_id: id});
				if( user_data ){
					let data = {
						id: user_data._id,
						name: user_data.name,
						email: user_data.email,
						last_activity: user_data.last_activity,
						avatar: user_data.profil_avatar || null,
						btn_add: user_data.waiting_confirm_friends,
						t_number: user_data.t_number,
					};
					if( data ){
						users.push( data );
					};
				};
			};
			if( users.length > 0 ){
				return reply.send({
					message: 'Заявки в друзья',
					await_confirm: users,
				})
			}
		}
	}
	catch(err){
		return reply.status(401).send({error: 'Ошибка обновления списка заявок'});
	}
});


fastify.post('/remove_all_users', async (request, reply) => {
	await User_Schema.deleteMany();
	console.log('Пользтвоатели удалены!')
})

fastify.post('/remove_all_messages', async (request, reply) => {
	await Message_Schema.deleteMany();
})

fastify.post('/main/confirm_friend', async (request, reply) => {
	const raw_token = request.headers.authorization; // мой токен (id аккаунта 1)
	const confirm_id = request.headers.confirm_id; // id запроса, который добавляем в друзья (id аккаунта 2)

	if( !raw_token ){
		return reply.status(401).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(401).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(401).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	}
	const email = decoded.email;
	if( !email ){
		return reply.status(401).send({error: 'Ошибка получения email'})
	};

	const my_user = await User_Schema.findOne({email});
	if( !my_user ){
		return;
	}

	try{
		const current_user = await User_Schema.findOne({_id: confirm_id}); // поиск пользователя с id запроса (id аккаунта 2)
		if( !current_user ){
			return reply.status(401).send({error: 'Не могу добавить пользователя в друзья с таким id.'});
		};

		// обновление у другого (id аккаунт 2)
		if( !current_user.friends.includes(my_user._id.toString()) ){
			// console.log(`He: Добавление друга (id: ${my_user._id})`);
			await User_Schema.updateOne(
				{_id: current_user._id},
				{$push: {
					friends: my_user._id.toString()
				} }
			);
			await User_Schema.updateOne(
				{_id: current_user._id},
				{$pull: {
					waiting_add_friends: my_user._id.toString()
				} }
			);
			await User_Schema.updateOne(
				{_id: current_user._id},
				{$pull: {
					waiting_confirm_friends: my_user._id.toString()
				} }
			);
		} 

		// обновление у меня (id аккаунт 1)
		if( !my_user.friends.includes(confirm_id) ){
			// console.log(`Me: Добавление друга (id: ${confirm_id})`);
			await User_Schema.updateOne(
				{email: email},
				{$push: {
					friends: confirm_id
				} }
			);
			await User_Schema.updateOne(
				{_id: my_user._id},
				{$pull: {
					waiting_add_friends: confirm_id
				} }
			);
			await User_Schema.updateOne(
				{_id: my_user._id},
				{$pull: {
					waiting_confirm_friends:confirm_id
				} }
			);
		}

		const friends = my_user.friends;
		return reply.send({
			message: 'Запрос принят!',
			friends: friends || null,
			refresh: true,
		})

	}
	catch(err){
		return reply.status(401).send({error: 'Не удалось принять запрос в друзья', err});
	};
});


fastify.post('/main/cancel_confirm_friend', async (request, reply) => {
	const raw_token = request.headers.authorization; // мой токен (id аккаунта 1)
	const canceled_id = request.headers.cancel_confirm_id; // id запроса, который отменяем (id аккаунта 2)

	if( !raw_token ){
		return reply.status(401).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(401).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(401).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	}
	const email = decoded.email;
	if( !email ){
		return reply.status(401).send({error: 'Ошибка получения email'})
	};

	const my_user = await User_Schema.findOne({email});
	if( !my_user ){
		return;
	}
	try{
		const canceled_user = await User_Schema.findOne({_id: canceled_id});
		if( !canceled_user ){
			return reply.status(401).send({error: 'Нельзя отменить запрос. ID неверный'});
		};

		// отменя у меня
		await User_Schema.updateOne(
			{_id: decoded.id},
			{$pull: {waiting_add_friends: canceled_id}}
		);
		await User_Schema.updateOne(
			{_id: decoded.id},
			{$pull: {waiting_confirm_friends: canceled_id }}
		);

		// у него
		await User_Schema.updateOne(
			{_id: canceled_id.toString()},
			{$pull: {waiting_add_friends: decoded.id }}
		);
		await User_Schema.updateOne(
			{_id: canceled_id.toString()},
			{$pull: {waiting_confirm_friends: decoded.id }}
		);

		return reply.send({
			message: 'Заявка в друзья отменена',
			refresh: true,
		})
	}
	catch(err){
		return reply.status(401).send({error: `Ошибка отмены запроса: `, err});
	}
});


fastify.post('/main/remove_friend', async (request, reply) => {
	const raw_token = request.headers.authorization; // мой токен (id аккаунта 1)
	const removed_id = request.headers.remove_id; // id запроса, который отменяем (id аккаунта 2)

	if( !raw_token ){
		return reply.status(401).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(401).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(401).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	}
	const email = decoded.email;
	if( !email ){
		return reply.status(401).send({error: 'Ошибка получения email'})
	};

	const my_user = await User_Schema.findOne({email});
	if( !my_user ){
		return;
	}
	try{
		const myId = decoded.id;
		const removed_user = await User_Schema.findOne({_id: removed_id.toString()});
		if( !removed_user ){
			return reply.status(401).send({error: 'ID запроса неверный'});
		};

		// у меня
		await User_Schema.updateOne(
			{_id: myId},
			{$pull: {
				friends: removed_id.toString(),
			}}
		);

		// у него
		await User_Schema.updateOne(
			{_id: removed_id.toString()},
			{$pull: {
				friends: myId.toString()
			}}
		);

		return reply.send({
			message: 'Удаление прошло успешно',
			refresh: true
		})
	}
	catch(err){
		return reply.status(401).send({error: 'Ошибка удаления из друзей: ', err});
	}
});


fastify.post('/main/get_outgoing_friends', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(401).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(401).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(401).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	}
	const myId = decoded.id;
	const email = decoded.email;
	if( !email || !myId){
		return reply.status(401).send({error: 'Ошибка получения email'})
	}
	try{
		const Im = await User_Schema.findOne({_id: myId});
		if( !Im ){
			return reply.status(401).send({
				error: 'Ваш ID пользователя неверный',
				logout: true
			});
		};
		const outgoing_friends = Im.waiting_add_friends;
		let full_outgoing_friends_data = [];
		for( const o_fr of outgoing_friends ){
			let o = await User_Schema.findOne({_id: o_fr});
			if( o ){
				let full_o = {
					id: o._id,
					name: o.name,
					email: o.email,
					last_activity: o.last_activity,
					avatar: o.profil_avatar,
					t_number: o.t_number,
				}
				full_outgoing_friends_data.push(full_o);
			}
		}
		if( full_outgoing_friends_data.length > 0 ){
			return reply.send({
				message: 'Исходящие заявки в друзья найдены',
				outgoing: full_outgoing_friends_data,
				refresh: true,
			})
		}
	}
	catch(err){
		return reply.status(401).send({error: 'Ошибка получения исходящих запросов в друзья', err});
	}
})


fastify.post('/main/get_friends', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(401).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(401).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(401).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	}
	const myId = decoded.id;
	const email = decoded.email;
	if( !email || !myId){
		return reply.status(401).send({error: 'Ошибка получения email'})
	}
	const this_my_page = request.body?.this_my_page;
	const user_page_id = request.body?.user_page_id;
	const group_id = request.body?.group_id;
	if( group_id ){
		try{
			const group = await Group_Schema.findOne({_id: group_id})
			if( !group ){
				console.log(`Ошибка: Группа с id [${group_id}] не существует`);
				return reply.send({error: `Ошибка: Группа с id [${group_id}] не существует`});
			}
		}
		catch(err){
			console.log(`Ошибка: ${err}`);
			return reply.send({error: `Ошибка: ${err}`});
		}
	};
	if( user_page_id ){
		try{
			let my_profil = await User_Schema.findOne({_id: user_page_id});
			if( my_profil.friends.length > 0 ){
				const raw_friends = my_profil.friends;
				let f_fr = [];

				async function set_friend(friend){
					let f = await User_Schema.findOne({_id: friend});
					if( f ){
						let f_data = {
							id: friend,
							name: f.name,
							email: f.email,
							last_activity: f.last_activity,
							profil_avatar: f.profil_avatar,
							t_number: f.t_number,
						};
						if( f_data ){
							f_fr.push(f_data);
						}
					}
				}

				if( raw_friends.length > 0 ){
					for( const f_friend of raw_friends ){
						await set_friend(f_friend);
					}
				}
				return reply.send({
					message: 'Друзья найдены',
					friends: f_fr,
					myId: myId,
				})
			}
			else {
				return reply.send({message: 'Поиск не дал результатов'})
			}
		}
		catch(err){
			return reply.status(401).send({error: 'Не удалось получить список друзей',err});
		}
	}
	else {
		try{
			let my_profil = await User_Schema.findOne({email});
			if( my_profil.friends.length > 0 ){
				const raw_friends = my_profil.friends;
				let f_fr = [];

				async function set_friend(friend){
					let f = await User_Schema.findOne({_id: friend});
					if( f ){
						let f_data = {
							id: friend,
							name: f.name,
							email: f.email,
							last_activity: f.last_activity,
							profil_avatar: f.profil_avatar,
							t_number: f.t_number,
						};
						if( f_data ){
							f_fr.push(f_data);
						}
					}
				}

				if( raw_friends.length > 0 ){
					for( const f_friend of raw_friends ){
						await set_friend(f_friend);
					}
				}
				return reply.send({
					message: 'Друзья найдены',
					friends: f_fr,
					myId: myId,
				})
			}
			else {
				return reply.send({message: 'Поиск не дал результатов'})
			}
		}
		catch(err){
			return reply.status(401).send({error: 'Не удалось получить список друзей',err});
		}
	}
});


fastify.post('/get_info_friend_or_not', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(401).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(401).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(401).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	}
	const email = decoded.email;
	const myId = decoded.id;
	if( !email){
		return reply.status(401).send({error: 'Ошибка получения email'})
	};
	const user_id = request.body?.user_id;
	if( !user_id ){
		console.log('Ошибка: user_id не передан');
		return reply.status(401).send({error: 'Ошибка: user_id не передан'});
	};
	if( user_id === myId ){
		return; // моя страница
	};
	const my_user = await User_Schema.findOne({_id: myId});
	if( !my_user ){
		console.log(`Ошибка id [${myId}]: Пользователь не найден`);
		return reply.send({error: `Ошибка id [${myId}]: Пользователь не найден`});
	};
	const current_user = await User_Schema.findOne({_id: user_id});
	if( !current_user ){
		console.log(`Пользователя с id [${user_id}] не существует`);
		return reply.send({error: `Пользователя с id [${user_id}] не существует`});
	};
	try{
		const he_is_friend = current_user?.friends.some(friend => friend === myId);
		const i_is_friend = my_user?.friends.some(friend => friend === current_user?._id.toString()); // если друг
		if( he_is_friend && i_is_friend ){
			return reply.send({
				i_is_friend: 'friend',
				refresh: true,
			});
		}
		else{
			const i_confirm = my_user?.waiting_add_friends.some(friend => friend === current_user?._id.toString());
			const he_confirm = current_user?.waiting_confirm_friends.some(friend => friend === myId);

			const he_page_confirm = my_user?.waiting_confirm_friends.some(friend => friend === current_user?._id.toString()); // принять в друзья на странице пользователя
			console.log('he_page_confirm = ', he_page_confirm);
			if( i_confirm && he_confirm ){
				return reply.send({
					i_is_friend: 'in_process',
					refresh: true,
				});
			}
			else if( he_page_confirm ){
				return reply.send({
					i_is_friend: 'need_to_add',
					refresh: true,
				});
			}
			else{
				return reply.send({ // если нет
					i_is_friend: 'no',
					refresh: true,
				});
			}
		}
	}
	catch(err){
		console.log('Ошибка: ', err);
		return reply.send({error: 'Ошибка: ', err});
	}
});


fastify.post('/main/get_peoples', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(401).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(401).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(401).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	}
	const email = decoded.email;
	const myId = decoded.id;
	if( !email){
		return reply.status(401).send({error: 'Ошибка получения email'})
	};
	try{
		const all_peoples = await User_Schema.find({email: {$ne: email}});
		if( all_peoples.length > 0 ){
			return reply.send({
				message: 'Пользователи найдены',
				peoples: all_peoples,
				myId: myId,
			})
		}
		else {
			return reply.send({message: 'Поиск не дал результатов'})
		}
	}
	catch(err){
		return reply.status(401).send({error: 'Не удалось получить список пользователей',err});
	}
});

fastify.post('/pre_loader_files_for_mails', async (request, reply) => {
	console.log('pre_loader_files_for_mails');
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	};
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	};
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const other_id = request?.body?.other_id?.value;
	if( !other_id ){
		console.error('other_id не передан');
		return reply.status(400).send({error: 'other_id не передан'});
	};
	console.log('other_id = ', other_id);
	const file = request.body?.file;
	if( !file ){
		console.log('Файл не передан на предзагрузку');
		return reply.status(401).send({error: 'Файл не передан на предзагрузку'});
	};
	let new_file_name = '';
	try{
		const dir = `${my_id}_${other_id}` || `${other_id}_${my_id}`;
		// const folder = path.join(__dirname, `../../src/images/max/${my_id}_${other_id}`);
		const folder = path.join(__dirname, `../../src/images/max/`);
		const folder_exist = await fs.access(folder)
		.then(()=>true)
		.catch((err)=>false);
		console.log('Папка существует? ', folder_exist);
		if( !folder_exist ){
			try{
				console.log('Папка не существует!');
				console.log('Создание...');
				await fs.mkdir(folder);
				console.log('Папка создана!');
			}
			catch(err){
				console.log('Не удалось создать папку. Ошибка: ', err);
			};
		};
		const file_ext = path.extname(file.filename);
		const number = Math.floor(Math.random()*1000000);
		const file_name = `${Date.now()}_-_file${number}_${my_id}_${other_id}_${file_ext}`; // новое full имя
		const file_path = path.join(folder, file_name);
		await fs.writeFile(file_path, await file.toBuffer());
		console.log(`Файл [${file_name}] загружен не сервер. Путь: ${file_path}`);
		new_file_name = file_name;
		if( file_name ){
			return reply.send({
				message: 'Предзагрузка успешна!',
				loaded_file: {
					name: file_name,
					full_name: file.filename,
					path: file_path,
				},
			})
		}
		else{
			return reply.send({error: 'Ошибка имени файла'});
		};
	}
	catch(err){
		console.log('Ошибка предзагрузки: ', err);
		return reply.send({error: 'Ошибка предзагрузки: ', err});
	}
});

fastify.post('/main/send_message', async (request, reply) => {
	// отправка сообщения
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(401).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(401).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(401).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};

	// мой id + данные
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({
			error: 'Ошибка передачи своего ID',
			logout: true,
		})
	};
	console.log('my_id = ', my_id || 'пусто');
	const my_data = await User_Schema.findOne({_id: my_id});
	if( !my_data ){
		return reply.status(401).send({
			error: 'ID вашего аккаунта не найден в базе',
			logout: true,
		});
	};
	console.log('my_data = ', my_data || 'пусто')

	// id другого + данные
	const raw_curr_id = request.body.curr_user && JSON.parse(request.body.curr_user.value) || null;
	if( !raw_curr_id ){
		return reply.status(401).send({error: 'Ошибка передачи ID пользователя'})
	};
	
	let curr_id;
	
	// если to === my_id => берём from
	if( raw_curr_id instanceof Object ){
		if( raw_curr_id.to === my_id ){
			curr_id = raw_curr_id.from;
		}
		else {
			curr_id = raw_curr_id.to
		}
	}
	else{
		curr_id = raw_curr_id;
	}

	const type = request?.body?.type.value;
	if( !type ){
		console.log('Не указан тип сообщения!');
		return reply.status(401).send({error: 'Не указан тип сообщения!'});
	}

	console.log('curr_id = ', curr_id);

	const curr_data = await User_Schema.findOne({_id: curr_id});

	if( !curr_data ){
		return reply.status(401).send({
			error: 'Пользователя с таким ID не существует',
		});
	};

	// переданное сообщение
	console.log('Переданное сообщение: ', request.body)
	const msg = request?.body?.text && request?.body?.text.value || null;
	const files = request.body.files && JSON.parse(request.body.files.value) || null;
	const voice = request?.body?.voice && request?.body?.voice || null;
	if( !msg && !files && !voice){
		console.log('Сообщение пустое')
		return reply.send({message: 'Сообщение пустое'});
	};
	if( msg ){
		console.log('msg = ', msg);
	};
	if( files ){
		console.log('files = ', files);
	};
	if( voice ){
		console.log('voice = ', voice);
	}
	const preloaded_voice_name = async () => {
		if( voice ){
			//установка пути к папке с аудио
			const folder_path = '../../src/audio_files/';
			const folder = path.join(__dirname, folder_path);
			const path_access = await fs.access(folder).then((e)=>true).catch((err)=>false);

			if( !path_access ){
				console.log('Папка с голосовых не существует.');
				console.log('Создание папки...');
				try{
					await fs.mkdir(path);
					console.log('Папка для голосовых создана!');
					console.log('Путь к папке: ', path);
				}
				catch(err){
					return console.log('Ошибка создания папки: ', err);
				};
			}
			else{
				console.log('Папка для головых существует!')
			}
			const voice_mimetype = voice?.mimetype;
			const voice_size = voice?.file?.bytesRead;
			const voice_name = voice?.filename;

			console.log('voice_mimetype = ', voice_mimetype);
			console.log('voice_size = ', voice_size);
			console.log('voice_name = ', voice_name);

			const normal_size = `${Math.floor(voice_size / 1024)}` + `${(Math.floor(voice_size / 1024) < 1023) && (Math.floor(voice_size) < 1024) ? 'Б' : 'Кб'}` || 'Ошибка';
			console.log('normal_size = ', normal_size);
			const new_voice_name = `${Date.now()}_voice_${voice_name}.webm`;
			console.log('new_voice_name = ', new_voice_name || 'Ошибка');
			const new_voice_path = path.join(folder_path, new_voice_name);
			//сохранение голосового на сервере
			try{
				console.log('Запись в хранилище...')
				await fs.writeFile(new_voice_path, await voice.toBuffer());
				console.log('Голосовое успешно загружено в хранилище!');
				return new_voice_name;
			}
			catch(err){
				console.log('Ошибка записи голосового в хранилище');
				return null;
			}
		}
		else{
			return null;
		}
	};

	if( files !== null && files.length > 0 ){
		if( files.length === 1 ){
			console.log('Файл = ', files);
		}
		else if( files.length > 1 ){
			console.log('Файлы = ', files);
		};
	};
	console.log('_____ 4')
	// создание сообщения
	try{
		// console.log('1271 [send_message] files = ', files[0]?.data?.loaded_file);
		// console.log('[1272] files = ', files);
		console.log('')
		const new_msg = new Message_Schema({
			to: curr_id,
			from: my_id,
			message: msg || '',
			voice: await preloaded_voice_name(),
			type: type,
			img: (files !== null && files.length > 0) && JSON.stringify(files) || null,
			status: 'uncheck',
			name_sender: my_data && my_data.name || null,
			name_to_send: curr_data.name,
		});
		await new_msg.save();
		console.log('Сообщение отправлено!');
		return reply.send({
			message: 'Сообщение отправлено!',
			refresh: true,
		})
	}
	catch(err){
		return reply.status(401).send({
			error: `Ошибка отправки сообщения: ${err}`
		})
	}
});

fastify.post('/main/get_messages', async (request, reply) => {
	// загрузка сообщений
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(401).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(401).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(401).send({error: 'Токен не передан'});
	}
	const curr_id = request.body.user_select_id;
	if( !curr_id ){
		return reply.status(401).send({
			error: 'Не передан id конкретного пользователя'
		})
	};
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({
			error: 'Не удалось расшифровать токен',
		});
	}
	const id = decoded.id;
	if( !id ){
		return reply.status(401).send({
			error: 'Ваш ID не обнаружен',
			logout: true,
		});
	}
	try{
		if( id ){
			const my_data = await User_Schema.findOne({_id: id});
			if( !my_data ){
				return reply.status(401).send({error: 'ID указан неверный'});
			};
			const from_my_messages = await Message_Schema.find({from: id});
			const for_me_messages = await Message_Schema.find({to: id});
			const all_msg = await Message_Schema.find(
				{$or: [
					{
						from: id,
						to: curr_id,
					},
					{
						from: curr_id,
						to: id
					},
					{
						from: curr_id.from,
						to: id
					},
					{
						from: id,
						to: curr_id.to,
					},
					{
						from: curr_id.from,
						to: curr_id.to,
					},
					{
						from: curr_id.to,
						to: curr_id.from,
					},
				]}
			);
			const counts_unchecked_messages = () => {
				let count = 0;
				if( all_msg.length > 0 ){
					all_msg.forEach(mail => {
						if( mail?.status === 'uncheck' ){
							count++;
						}
					})
				};
				return count;
			};
			if( all_msg.length > 0 ){
				// console.log(all_msg)
			}

			return reply.send({
				message: 'Сообщения найдены',
				from_my_messages: from_my_messages || null,
				for_me_messages: for_me_messages || null,
				all_msg: all_msg || null,
				counts_unchecked_messages: counts_unchecked_messages(),
			})
		}
	}
	catch(err){
		return reply.status(401).send({
			error: 'Ошибка получения сообщений', err
		})
	}
});

fastify.get('/get_notifications', async (request, reply) => {
	const { type, ws_message_type, my_id } = request?.query
	let user = null;
	try{
		const my_user = await User_Schema.findOne({_id: my_id});
		if( my_user ){ 
			user = my_user
		};
	}
	catch(err){
		console.log('Ошибка: ', err);
	};

	if( !user ){return;}

	const mails = async () => {
		//сообщения
		try{
			const mails = await Message_Schema.find({
				$or: [
					{
						to: my_id,
						name_to_send: user?.name,
					},
					{
						from: my_id,
						name_to_send: user?.name,
					},
				]
			});
			if( mails !== null && mails.length > 0 ){
				let count_m = 0;
				mails.forEach(mail => {
					if( mail?.status === 'uncheck' ){
						count_m++;
					}
				})
				return count_m || 0;
			}
			else if( mails === null || mails === undefined ){ 
				console.log('Ошибка: mails = ', mails);
			}
		}
		catch(err){
			throw err
		}
	};

	const friends = async () => {
		//друзья
		try{
			const my_friends = user?.waiting_confirm_friends || null;
			if( my_friends !== null && my_friends.length > 0 ){
				let count_f = 0;
				my_friends.forEach(friend => {
					count_f++
				})
				return count_f || 0;
			}
			else if( my_friends === null || my_friends === undefined ){ 
				console.log('Ошибка: my_friends = ', my_friends);
			}
		}
		catch(err){
			throw err;
		}
	};

	const invites = async () => {
		//приглашения
		try{
			const invites = await Invites_Schema.find({id_for: my_id});
			if( invites !== null && invites.length > 0 ){
				let count_i = 0;
				invites.forEach(invite => {
					count_i++
				})
				return count_i || 0;
			}
			else if( invites === null || invites === undefined ){
				console.log('Ошибка: invites = ', invites);
			}

		}
		catch(err){
			throw err;
		}
	}

	const uncheck_mails_count = await mails();
	const new_friends_count = await friends();
	const new_invites_count = await invites();

	// при обновлении
	if( ws_message_type === 'refresh' ){
		return reply.send({
			uncheck_mails_count: uncheck_mails_count || 0,
			new_friends_count: new_friends_count || 0,
			new_invites_count: new_invites_count || 0,
		})
	};

	return reply.send({
		uncheck_mails_count: uncheck_mails_count || 0,
		new_friends_count: new_friends_count || 0,
		new_invites_count: new_invites_count || 0,
	})
});


fastify.post('/main/get_active_messages', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(401).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(401).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(401).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	try{
		let f = [];
		let u = new Set();
		let last_counts_mails = new Map();

		const all_msg = await Message_Schema.find({
			$or: [
				{from: my_id},
				{to: my_id}
			]
		});	
		
		if( all_msg.length > 0 ){
			all_msg.map((msg)=>{
				const path_sort = [msg.to, msg.from].sort();
				const key = `${path_sort[0]}-${path_sort[1]}`;
				last_counts_mails.set(key,msg);
			})
		}
		f = Array.from(last_counts_mails.values());
		if( f.length > 0 ){
			return reply.send({
				message: 'Сообщения получены',
				msg: f,
			})
		}
	}
	catch(err){
		return reply.status(401).send({error: 'Ошибка загрузки активных сообщений'})
	}
})

fastify.post('/get_user_data', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(401).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(401).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(401).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const other_id = request.headers.other_id;
	if( !other_id ){
		console.log('Выполняется поиск "my_data"')
		try{
			const my_data = await User_Schema.findOne({_id: my_id});
			if( my_data.name ){
				const raw_date = my_data.createdAt;
				const year = raw_date.getFullYear();
				const month = String(raw_date.getMonth() + 1).padStart(2,'0');
				const day = String(raw_date.getDate()).padStart(2,'0');
				// console.log('Мои данные: ', my_data);

				const normal_date = {
					year: year,
					month: month,
					day: day,
				}

				return reply.send({
					message: 'Имя',
					my_name: my_data.name,
					my_email: my_data.email,
					my_id: my_id,
					my_date: normal_date,
					my_avatar: my_data.profil_avatar,
					my_waiting_join_in_group: my_data.waiting_join_in_group,
				})
			};
		}
		catch(err){
			return reply.status(401).send({error: 'Не смог найти вас в базе данных'})
		}
	}
	else{
		console.log('Выполняется поиск "other_data"')
		try{
			// console.log(`other_id получен: ${other_id}, выполняю поиск по базе данных`)
			const other_date = await User_Schema.findOne({_id: other_id});
			if( !other_date ){
				console.log('Ошибка: Не смог найти пользователя с ID: ', other_id);
				return reply.send({error: 'Не смог найти пользователя с ID: ', other_id})
			};
			console.log('Данные Other пользователя: ', other_date)
			// console.log('Нашёл пользователя с ID: ', other_id);
			// console.log('Имя этого пользователя: ', other_date.name)
			if( other_date.name ){
				const raw_date = other_date.createdAt;
				const year = raw_date.getFullYear();
				const month = String(raw_date.getMonth() + 1).padStart(2,'0');
				const day = String(raw_date.getDate()).padStart(2,'0');

				const normal_date = {
					year: year,
					month: month,
					day: day,
				}

				return reply.send({
					message: 'Other',
					other_name: other_date.name,
					other_email: other_date.email,
					other_id: my_id,
					other_date: normal_date,
					other_avatar: other_date.profil_avatar,
				})
			};
		}
		catch(err){
			return reply.status(401).send({error: 'Не смог найти вас в базе данных'})
		}
	}
});

fastify.post('/mails/change_status', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(401).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(401).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(401).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const mail = request.body.mail;
	if( !mail ){
		return console.log('Сообщение не передано на изменение статуса');
	};
	try{
		const current_mail = await Message_Schema.findOne({_id: mail._id});
		if( current_mail ){
			if( current_mail.status === 'uncheck' ){
				if( current_mail._id ){
					await Message_Schema.updateOne({_id: current_mail._id},{$set:{status: 'check'}});
					console.log('Изменение статуса сообщения ', mail._id, ' на "прочитано"')
					return reply.send({
						message:'Статус изменён на "прочитано"',
						change: 'ok',
					})
				}	
			}
		}
	}
	catch(err){
		console.log('Ошибка обновления статуса у сообщения: ', err);
		return reply.status(401).send({error: 'Ошибка изменения статуса: ', err});
	}
});

fastify.post('/clear_waiting_in_group', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const group_id = request.body?.group_id;
	if( !group_id ){
		console.log('id группы не передано [1490]');
		return reply.status(401).send({error: 'id группы не передано [1490]'});
	}
	const group = await Group_Schema.findOne({_id: group_id});
	if( !group ){
		console.log(`Группа с id [${group_id}] не найдена`);
		return reply.send({error: `Группа с id [${group_id}] не найдена`});
	};
	try{
		await User_Schema.updateOne({_id: my_id},{
			$set:{
				waiting_join_in_group: null,
			}
		});
		console.log('Очистка waiting_join_in_group успешна!');
		return reply.send({message: 'Очистка waiting_join_in_group успешна'});
	}
	catch(err){
		console.log('Ошибка: ', err);
		return reply.send({error: 'Ошибка: ', err});
	}
})

fastify.post('/remove_message', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(401).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(401).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(401).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const checked_items = JSON.parse(request.body.checked_items);
	if( checked_items ){
		try{
			checked_items.map(async(mail)=>{
				const m = await Message_Schema.findOne({_id: mail});
				if( m ){
					// сперва удаляем изображения и голосовые...
					if( m?.img !== null ){
						// удаляем изображение...
						try{
							const parsed_imgs = JSON.parse(m?.img);
							if( !parsed_imgs ){
								console.log('Ошибка расшифровки изображений');
							};
							console.log('parsed_imgs = ', parsed_imgs);
							parsed_imgs.forEach(img => {
								if( img ){
									console.log('loaded_file = ', img?.data?.loaded_file);
									try{
										const remove_img = async () => {
											//поиск пути до изображения
											const img_name = img?.data?.loaded_file?.name;
											const folder = path.join(__dirname, '../../src/images/max');
											const folder_exist = await fs.access(folder).then(()=>true).catch((err)=>false);
											if( !folder_exist ){
												return console.log('Папка не существует для файла: ', img?.data?.loaded_file?.name);
											};
											const img_path = path.join(folder, img?.data?.loaded_file?.name);
											if( !img_path ){
												return console.log('Ошибка пути изображения! Не могу найти конкретное изображение: ', img?.data?.loaded_file?.name);
											};
											//удаление изображения...
											try{
												console.log(`Удаление изображения ${img?.data.loaded_file?.name} ...`);
												await fs.unlink(img_path);
												console.log(`Изображение ${img?.data?.loaded_file?.name} удалено!`);
											}
											catch(err){
												console.log(`Ошибка удаления изоюражения: ${img?.data?.loaded_file?.name}. `, err);
											}
										};
										(async()=>{
											remove_img();
										})();
									}
									catch(err){
										console.log('Не могу найти путь до изображения: ', err);
									}
								}
								else{
									console.log('Изображение ошибочное')
								};
							});
						}
						catch(err){
							console.log('Ошибка удаления изображения: ', err);
						}
					};
					if( m?.voice !== null ){
						// Удаляем голосовое...
						try{
							const remove_voice = async () => {
								console.log('m?.voice = ', m?.voice)
								const folder_with_voices = path.join(__dirname, `../../src/audio_files`);
								const folder_with_voices_exist = await fs.access(folder_with_voices).then(()=>true).catch((err)=>false);
								if( !folder_with_voices_exist ){
									return console.log(`Папка для файла ${m?.voice} не существует!`);
								};
								const voice_path = path.join(folder_with_voices, m?.voice);
								const voice_exist = await fs.access(voice_path).then(()=>true).catch((err)=>false);
								if( !voice_exist ){
									return console.log(`Голосовое ${m?.voice} не найдено в папке ${voice_path}`);
								};
								try{
									// удаление голосового...
									console.log(`Удаление голосового ${m?.voice} ...`);
									await fs.unlink(voice_path);
									console.log(`Голосовое ${m?.voice} успешно удалено из папки ${folder_with_voices}`);
								}
								catch(err){
									console.log('Ошибка удаления голосового: ', err);
								}
							};
							(async()=>{
								remove_voice();
							})();
						}
						catch(err){
							console.log('Ошибка удаления голосового: ', err);
						}
					};

					await Message_Schema.deleteOne({_id: mail});
					console.log(`Сообщение с id(${mail}) успешно удалено!`);
					return reply.send({
						message: 'Удаление сообщений успешно!',
						refresh: true,
					});
				}
			})
		}
		catch(err){
			return reply.send({error: 'Ошибка: ', err});
		}
	}
});

fastify.post('/load_avatar', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(401).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(401).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(401).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const file = request.body.file;
	if( !file ){
		console.log('Ошибка! Файл не передан!')
		return reply.send({error: 'Ошибка! Файл не передан! ', err});
	};
	console.log('Этап загрузки аватарки профиля...');
	console.log('Выбранный файл: ', file.filename)
	if( file ){
		try{
			const old_avatar_name = my_user.profil_avatar !== null || '' ? my_user.profil_avatar : '';
			const folder = path.join(__dirname, '../../src/images/profils');
			const dir_exist = await fs.access(folder)
			.then(()=>true)
			.catch((err)=>false);
			console.log('Папка существует? ', dir_exist);
			const file_ext = path.extname(file.filename);
			const file_name = `${Date.now()}${file_ext}`;
			const file_path = path.join(folder, file_name);
			await fs.writeFile(file_path, await file.toBuffer(file.filename));
			console.log('Пользователь [', my_user.name,'] загрузил аватарку на сервер');

			// добавление (изменение) пути к изображению в UserSchema
			await User_Schema.updateOne({'_id': my_id},{
				$set: {'profil_avatar': file_name},
			})

			// удаление старой аватарки
			// проверка папки
			const old_folder = path.join(__dirname, '../../src/images/profils');
			const old_path_exist = await fs.access(old_folder)
			.then(()=>true)
			.catch((err)=>false);
			console.log('Старая папка существует? ', old_path_exist);

			//проверка файла в папке
			const old_avatar_path = path.join(old_folder, old_avatar_name);
			const old_avatar_exist = await fs.access(old_avatar_path)
			.then(()=>true)
			.catch((err)=>false);
			console.log('Старая аватарка существует? ', old_avatar_exist);

			// применение изменений к группам
			try{
				console.log('ПОИСК ГРУПП')
				// поиск по старой аватарке и замена на новую
				const groups = await Group_Schema.find();
				if( groups.length > 0 ){
					console.log('ГРУППЫ НАЙДЕНЫ')
					groups.forEach( async group => {
						console.log('РАЗБОР ГРУППЫ ', group)
						console.log('OLD_AVATAR_NAME = ', old_avatar_name);

						group?.group_members.forEach( async member => {
							if( member?.profil_avatar === old_avatar_name ){
								await Group_Schema.updateMany({
									_id: group?._id
								},{
									$set: {
										'group_members.$[member]':{
											...member,
											'profil_avatar': file_name
										}
									}
								},{
									arrayFilters: [
										{
											'member.profil_avatar': old_avatar_name
										}
									]
								})
							}
						})

					})
				}
			}
			catch(err){
				console.log('Ошибка применения изменений к группам: ', err);
				return reply.send({error: 'Ошибка применения изменений к группам: ', err})
			}

			if( old_avatar_name !== null && old_folder && old_avatar_path && old_avatar_exist ){
				try{
					await fs.unlink(old_avatar_path, old_avatar_name);
					console.log('Старая аватарка успешно удалена!');
				}
				catch(err){
					console.log('Не удалось удались старую аватарку! ', err);
				}
			}

			return reply.send({
				message: 'Аватарка загружена на сервер',
				file_name: file_name,
				refresh: true,
			})
		}
		catch(err){
			console.log('Ошибка загрузки новой аватарки на сервер! ', err);
			return reply.status(401).send({error: 'Ошибка загрузки новой аватарки на сервер! ', err});
		}	
	}
});

fastify.post('/get_data_active_mails', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(401).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(401).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(401).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const mails = JSON.parse(request.body.active_mails);
	if( !mails ){
		return console.log('mails = 0')
	}
	try{
		if( mails.length > 0 ){
			const data_profil_avatar = await Promise.all(
				mails.map(async(mail)=>{
					const target_id = my_id === mail.from ? mail.to : mail.from;
					try{
						const user = await User_Schema.findOne({_id: target_id});
						if( user ){
							const user_profil_avatar = user.profil_avatar;
							if( user_profil_avatar ){
								return {
									user_id: user._id,
									user_profil_avatar: user_profil_avatar,
								};
								return null;
							};
						}
					}	
					catch(err){
						console.log('Ошибка: ', err);
						return null;
					}
				})
			);
			if( data_profil_avatar.length > 0 ){
				return reply.send({
					message: 'Аватары получены',
					data_profil_avatar: data_profil_avatar,
				})
			}
		}
	}
	catch(err){
		return reply.send({error: 'Ошибка получения аватарок активных сообщений', err});
	};
});

fastify.post('/create_group', async (request, reply) => {
	console.log('ЗАПРОС /CREATE_GROUP')
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(401).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(401).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(401).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(400).send({error: 'Пользователь не найден! ', err});
	};

	const name = request.body.group_name.value;
	let file = request.body.group_img; // file . нужно сперва его сохранить в папку. потом уже отправлять обратно filename
	const raw_settings = request.body.group_settings.value; // настройки группы ( пароль | тип группы )
	const parsed_settings = JSON.parse(raw_settings);
	const raw_password = parsed_settings?.password;
	if( !raw_password ){
		console.log('Создание группы без пароля [r]')
	};
	let hashed_password = '';
	if( raw_password ){
		hashed_password = await bcrypt.hash(raw_password, 10);
	}
	if( !hashed_password && hashed_password !== '' ){
		console.log('Ошибка создания пароля [h]');
	}
	const settings = JSON.stringify({...parsed_settings, password: hashed_password});
	let name_loaded_file = '';

	// работа с файлом
	if( file.filename !== '' && file.filename !== null && file.filename !== undefined ){
		try{
			const dir = path.join(__dirname, '../../src/images/groups_profils/');
			const dir_exist = await fs.access(dir)
			.then(()=>{return true})
			.catch((err)=>{return false});
			console.log('Папка groups_profils существует? ', dir_exist);
			if( !dir_exist ){
				return;
			};
			// const file_ext = path.extname(file.filename);
			// const file_name = `${Date.now()}${file_ext}`;
			// const file_path = path.join(dir, file_name);

			const file_ext = path.extname(file.filename); // расширение
			const file_name = `${Date.now()}_-_${file.filename}`; // имя
			const number = Math.floor(Math.random()*1000000);
			const new_full_name = `${Date.now()}_-_avatar${number}${file_ext}`; // новое full имя
			const new_file_name = `avatar${number}${file_ext}`;
			const file_path = path.join(dir, new_full_name); // путь

			await fs.writeFile(file_path, await file.toBuffer());
			console.log(`Изображение загружено в папку groups_profils. (${new_full_name})`);
			name_loaded_file = new_full_name;
			file = '';
		}
		catch(err){
			console.log('Ошибка: file error. ', err);
			return reply.status(400).send({error: 'Ошибка: file error', err});
		}
	}

	const new_group = new Group_Schema({
		group_name: name,
		group_img: name_loaded_file,
		group_settings: settings,
		group_admins: [
			{
				id: my_id,
				role: 'main_admin',
			}
		],
		group_members: [
			{
				id: my_id,
				role: 'main_admin',
				profil_avatar: my_user?.profil_avatar || false,
				username: my_user?.name,
			}
		],
		group_creator: my_id,
	});

	try{
		const exist_group_name = await Group_Schema.find({group_name: name});
		if( exist_group_name.length > 0 ){
			console.log('/create_group: Попытка создать группу с названием: ', name,'. Имя занято!');
			return reply.send({error: 'Название группы занято!'});
		}
		if ( new_group ){
			await new_group.save();
			return reply.send({
				message: `Группа ${name} успешно создана!`,
				refresh: true,
			});
		};
	}
	catch(err){
		console.log('/create_group: Ошибка: ', err);
		return reply.status(400).send({error: 'Ошибка: ', err});
	}
});

fastify.post('/check_passwords', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const group_id = request.body?.group_id;
	if( !group_id ){
		console.log('id группы не передано [1897]');
		return reply.status(401).send({error: 'id группы не передано [1897]'});
	}
	const group = await Group_Schema.findOne({_id: group_id});
	if( !group ){
		console.log(`Группа с id [${group_id}] не найдена`);
		return reply.send({error: `Группа с id [${group_id}] не найдена`});
	};
	const current_password = JSON.parse(group?.group_settings)?.password;
	if( current_password === null || current_password === undefined ){
		console.log('Существуюший пароль не найден');
		return reply.status(400).send({error: 'Ошибка! Существующий пароль не найден'});
	}
	const enter_password = request.body?.enter_password;
	if( !enter_password ){
		console.log('Не передан пароль для сравнения');
		return reply.status(401).send({error: 'Не передан пароль для сравнения'});
	}
	try{
		const compare_passwords = await bcrypt.compare(enter_password, current_password);

		// + установка last_page
		try{
			await User_Schema.updateOne({_id: my_id},
				{
					$set: {
						last_page: {
							last_page: group_id,
							group_password: group?.group_settings?.password,
						}
					}
				}
			);
			console.log('Установка новой last_page успешна!');
		}
		catch(err){
			console.log('Ошибка установки last_page: ', err);
		};

		if( compare_passwords ){
			console.log('Пароли совпадают')
			return reply.send({
				message: 'Пароли прошли проверку',
				compare: true,
				refresh: true,
			})
		}
		else {
			console.log('Пароли не совпадают')
			return reply.send({
				message: 'Пароли не прошли проверку',
				compare: false,
				refresh: true,
			})
		};
	}
	catch(err){
		console.log('Ошибка сравнения паролей: ', err);
		return reply.send({error: 'Ошилка сравнения паролей: ', err});
	}
});

fastify.post('/get_groups', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const user_page_id = request.body?.user_page_id;
	if( !user_page_id ){
		try{
			const groups = await Group_Schema.find();
			const my_groups = await Group_Schema.find({group_creator: my_id});
			const groups_where_i_have = await Group_Schema.find({
				group_creator: {$ne: my_id},
				'group_members.id': my_id,
			});
			if( groups.length > 0 ){
				// console.log('Список найденных групп: ', groups);
				return reply.send({
					message: 'Группы найдены',
					groups: groups,
					my_groups: my_groups || [],
					groups_where_i_have: groups_where_i_have || [],
				})
			}
			else {
				console.log('Групп нет');
				return reply.send({
					groups: [],
					my_groups: [],
					groups_where_i_have: [],
				})
			}
		}
		catch(err){
			console.log('/get_groups: Ошибка: ', err);
			return reply.status(401).send({error: 'Ошибка: ', err});
		}
	}
	else {
		try{
			const groups = await Group_Schema.find();
			const my_groups = await Group_Schema.find({group_creator: user_page_id});
			const groups_where_i_have = await Group_Schema.find({
				group_creator: {$ne: user_page_id},
				'group_members.id': user_page_id,
			});
			if( groups.length > 0 ){
				// console.log('Список найденных групп: ', groups);
				return reply.send({
					message: 'Группы найдены',
					groups: groups,
					my_groups: my_groups || [],
					groups_where_i_have: groups_where_i_have || [],
				})
			}
			else {
				console.log('Групп нет');
				return reply.send({
					groups: [],
					my_groups: [],
					groups_where_i_have: [],
				})
			}
		}
		catch(err){
			console.log('/get_groups: Ошибка: ', err);
			return reply.status(401).send({error: 'Ошибка: ', err});
		}
	}
});

fastify.post('/check_my_groups', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const my_groups_list = request?.body?.my_groups_list;
	if( !my_groups_list ){
		console.log('Ошибка: my_groups_list не передано');
		return reply.send({error: 'Ошибка: my_groups_list не передано'});
	};
	try{
		my_groups_list.forEach( async (group) => {
			try{
				const match = await Group_Schema.findOne({_id: group?._id});
				if( match ){
					//нашлась
					console.log(`Группа ${group?._id} существует`);
					reply.send({
						message: 'Группа есть',
						group: group,
						remove: false,
					})
				}
				else{
					console.log(`Группа ${group?._id} не существует`);
					reply.send({
						message: 'Группы нет',
						group: null,
						remove: true,
					})
				}
			}
			catch(err){
				console.log('Ошибка: ', err);
				return reply.send({error: 'Ошибка: ', err});
			};
		});
	}
	catch(err){
		console.log('Ошибка: ', err);
		return reply.send({error: 'Ошибка: ',err});
	}
});

fastify.post('/remove_all_groups', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	try{
		await Group_Schema.deleteMany({});
		console.log('Список групп очищен');
		return reply.send({message: 'Список групп очищен', refresh: true});
	}
	catch(err){
		console.log('Ошибка удаления списка групп: ', err);
		return reply.send({error: 'Ошибка удаления списка групп' , err});
	}
});

fastify.post('/remove_group', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const id = request.headers.id;
	if( !id ){
		console.log('Не передан ID группы для удаления');
		return reply.send({error: 'Не передан ID группы для удаления'});
	};
	try{
		const group_exist = await Group_Schema.findOne({_id: id});
		if( !group_exist ){
			console.log('Ошибка: Группы с такий ID не существует');
			return reply.status(400).send({
				error: 'Ошибка: Группы с таким ID не существует',
				refresh: true,
			});
		};
		const group_img = group_exist?.group_img;
		if( group_img ){
			console.log('group_img = ', group_img)

			//сперва удаляем шапку (если олна есть)
			try{
				const group = await Group_Schema.find({_id: id});
				if( !group ){
					console.log('Такой группы нет');
					return reply.send({error: 'Такой группы нет'});
				};
				const group_header = group[0]?.group_header;
				if( group_header ){
					console.log('group_header = ', group_header)
					// удаление аватарки группы с сервера
					try{
						const folder_path = '../../src/images/groups_headers/';
						const folder_exist = await fs.access(folder_path)
						.then(()=>true)
						.catch((err)=>false);
						console.log('Папка существует? ', folder_exist);
						if( folder_exist ){
							const files_ext = ['.jpg'];
							const folder_files = await fs.readdir(folder_path);
							const images = folder_files.filter(file=>{
								const ext = '.' + file.split('.').pop();
								return files_ext.includes(ext);
							});
							if( images.length > 0 ){
								console.log('Найденные файлы = ', images);
								images.forEach((file, index) => {
									if( file === group_header ){
										console.log(`Нашёл совпадение! index = ${index}, file [${file}] = group_img [${group_header}]`);
										try{
											const remove_file = async (file) => {
												await fs.unlink(`${folder_path}/${file}`);
											}
											remove_file(file);
										}
										catch(err){
											console.log('Ошибка удаления: ', err);
										}
										console.log('Файл удалён!');
									}
								})
							}
						}
					}
					catch(err){
						console.log('Ошибка удаления шапки группы: ', err);
						return reply.send({error: 'Ошибка удаления шапки группы: ', err});
					}
				}
			}
			catch(err){
				console.log('Ошибка удаления старой шапки (если она была): ', err);
				return reply.send({error: 'Ошибка удаления старой шапки: ', err});
			}

			// удаление аватарки группы с сервера
			try{
				const folder_path = '../../src/images/groups_profils/';
				const folder_exist = await fs.access(folder_path)
				.then(()=>true)
				.catch((err)=>false);
				console.log('Папка существует? ', folder_exist);
				if( folder_exist ){
					const files_ext = ['.jpg'];
					const folder_files = await fs.readdir(folder_path);
					const images = folder_files.filter(file=>{
						const ext = '.' + file.split('.').pop();
						return files_ext.includes(ext);
					});
					if( images.length > 0 ){
						console.log('Найденные файлы = ', images);
						images.forEach((file, index) => {
							if( file === group_img ){
								console.log(`Нашёл совпадение! index = ${index}, file [${file}] = group_img [${group_img}]`);
								try{
									const remove_file = async (file) => {
										await fs.unlink(`${folder_path}/${file}`);
									}
									remove_file(file);
								}
								catch(err){
									console.log('Ошибка удаления: ', err);
								}
								console.log('Файл удалён!');
							}
						})
					}
				}
			}
			catch(err){
				console.log('Ошибка удаления аватарки группы: ', err);
				return reply.send({error: 'Ошибка удаления аватарки группы: ', err});
			}
		}
		//удаление...
		await Group_Schema.deleteOne({_id: id});
		// + удаление файлов с сервера
		try{
			const dir = path.join(__dirname, `../../src/images/groups_images/${id}`);
			const dir_exist = await fs.access(dir)
			.then(()=>{return true})
			.catch((err)=>{return false});
			console.log(`Папка [${id}] существует? ${dir_exist}`);
			if( dir_exist ){
				await fs.rm(dir, {recursive: true});
				console.log(`Папка группы [${id}] успешно удалена`);
			}
		}
		catch(err){
			console.log('Не удалось удались папку группы. ', err);
			return reply.send({error: 'Не удалось удалить папку группы. ', err});
		};
		console.log(`Группа с ID (${id}) успешно удалена!`);
		return reply.send({
			message: `Группа с ID (${id}) успешно удалена!`,
			refresh: true,
		});
	}
	catch(err){
		console.log('/remove_group: Ошибка удаления: ', err);
		return reply.send({error: 'Ошибка удаления: ', err});
	}
});

fastify.post('/get_group_data', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const group_id = request.headers.group_id;
	if( !group_id ){
		console.log('id группы не передано [2279]');
		return reply.status(400).send({error: 'id группы не передано [2279]'})
	}
	try{
		// поиск группы
		const current_group = await Group_Schema.findOne({_id: group_id});
		if( !current_group ){
			console.log(`Группы с id ${group_id} не существует`)
			return reply.status(400).send({error: `Группы с id ${group_id} не существует`});
		};
		return reply.send({
			message: 'Данные группы получены',
			group_data: current_group,
		})
	}
	catch(err){
		console.log('Ошибка получения данных: ', err);
		return reply.status(400).send({error: 'Ошибка получения данных: ', err});
	}
});

fastify.post('/save_titles', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const group_id = request.body?.group_id;
	if( !group_id ){
		console.log('id группы не передано [2327]');
		return reply.status(400).send({error: 'id группы не передано [2327]'})
	};
	const titles = request.body?.titles;
	if( !titles ){
		console.log('Описание не передано на изменение');
		return reply.status(400).send({error: 'Ошибка изменения описания группы'});
	}
	try{
		if( titles !== '/clear_this/'){
			// поиск группы
			const current_group = await Group_Schema.findOne({_id: group_id});
			if( !current_group ){
				console.log(`Группы с id ${group_id} не существует`)
				return reply.status(400).send({error: `Группы с id ${group_id} не существует`});
			};
			await Group_Schema.updateOne(
				{_id: group_id},
				{$set:{group_titles: titles}}
			)
			return reply.send({
				message: 'Описание изменено',
				refresh: true,
			})
		}
		else {
			// поиск группы
			const current_group = await Group_Schema.findOne({_id: group_id});
			if( !current_group ){
				console.log(`Группы с id ${group_id} не существует`)
				return reply.status(400).send({error: `Группы с id ${group_id} не существует`});
			};
			await Group_Schema.updateOne(
				{_id: group_id},
				{$set:{group_titles: ''}}
			)
			return reply.send({
				message: 'Описание изменено',
				refresh: true,
			})
		}
	}
	catch(err){
		console.log('Ошибка изменения описания: ', err);
		return reply.status(400).send({error: 'Ошибка изменения описания: ', err});
	}
});

fastify.post('/pre_loader_files', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const group_id = request?.body?.group_id?.value;
	if( !group_id ){
		console.log('id группы не передано [2402]');
		return reply.status(400).send({error: 'id группы не передано [2402]. group_id = ', group_id})
	};

	const file = ()=>{
		const f = request?.body?.file;
		if( f?.value === '[object Object]'){
			const parsed_f = JSON.parse(f);
			return parsed_f;
		}
		else{
			return f;
		}
	};
	if( !file ){
		console.log('Файл не передан')
	};
	const current_file = file();
	console.log(current_file);
	const file_index = request?.body?.file_index?.value;
	try{
		if( current_file?.type === 'file' ){
			// НОВОЕ ИЗОБРАЖЕНИЕ
			const dir = path.join(__dirname, `../../src/images/groups_images/${group_id}/`);
			const dir_exist = await fs.access(dir)
			.then(()=>true)
			.catch(()=>false);
			console.log('Папка существует? ', dir_exist);
			if( !dir_exist ){
				//создание папки
				try{
					await fs.mkdir(dir);
					console.log(`Папка ${dir} успешно создана`);
				}
				catch(err){
					console.log(`Ошибка создания папки ${dir}. Error: ${err}`);
					return;
				}
			};
			const file_ext = path.extname(current_file.filename); // расширение
			const file_name = `${Date.now()}_-_${current_file.filename}`; // имя
			const number = Math.floor(Math.random()*1000000);
			const new_full_name = `${Date.now()}_-_file${number}${file_ext}`; // новое full имя
			const new_file_name = `file${number}${file_ext}`;
			const file_path = path.join(dir, new_full_name); // путь
			try{
				await fs.writeFile(file_path, await current_file.toBuffer());
				console.log(`Файл ${new_full_name} загружен в папку ${group_id}`);
			}
			catch(err){
				return console.log('Не удалось загрузить файл ',file.filename,'. Ошибка: ', err);
			};
			console.log('+')
			console.log(`file_name = ${file_name}`);
			console.log(`new_file_name = ${new_file_name}`)
			console.log(`current_file.filename = ${current_file.filename}`)
			console.log(`file_path = ${file_path}`)
			return reply.send({
				message: 'Предварительный файл загружен!',
				loaded: true,
				loaded_file: {
					full_name: new_full_name,
					file_name: new_file_name,
					file_path: file_path,
				},
				file_index: file_index || 'empty',
			})
		}
		else{
			// СТАРОЕ ИЗОБРАЖЕНИЕ
			console.log('++')
			console.log('loaded_file = ', JSON.parse(file()?.value)?.old_file?.data?.loaded_file)
			return reply.send({
				message: 'Предварительный файл загружен!',
				loaded: true,
				loaded_file: JSON.parse(file()?.value)?.old_file?.data?.loaded_file,
				file_index: file_index || 'empty',

			})
		}
		// В ОБЩЕМ ЭТО РАБОТАЕТ, ОН ОПРЕДЕЛЯЕТ СТАРЫЕ ИЗОБРАЖЕНИЯ И НОВЫЕ, ЗАГРУЖАЕТ НОВЫЕ ДЛЯ ПОСТОВ, НО ПОКА НЕ ДОБАВЛЯЕТ НОВЫЕ ИЗОБРАЖЕНИЯ К СУЩЕСТВУЮЩИМ
		// НУЖНО ЭТО НАСТРОИТЬ
		// + Я СЛОМАЛ СМЕНУ ГОТОВЫХ ИЗОБРАЖЕНИЙ :(
	}
	catch(err){
		console.log('Ошибка предварительной загрузки файлов!', err);
		return reply.send({error: 'Ошибка предварительной загрузки файлов!', err});
	}
});

fastify.post('/pre_loader_files_for_user_page', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};

	const file = ()=>{
		const f = request?.body?.file;
		if( f?.value === '[object Object]'){
			const parsed_f = JSON.parse(f);
			return parsed_f;
		}
		else{
			return f;
		}
	};
	if( !file ){
		console.log('Файл не передан')
	};

	console.log('ЗАГРУЖАЕМЫЙ ФАЙЛ = ', file);
	// return;

	const current_file = file();
	console.log('current_file = ', current_file);
	const file_index = request?.body?.file_index?.value;
	try{
		if( current_file?.type === 'file' ){
			// НОВОЕ ИЗОБРАЖЕНИЕ
			const dir = path.join(__dirname, `../../src/images/user_page_images/${my_id}/`);
			const dir_exist = await fs.access(dir)
			.then(()=>true)
			.catch(()=>false);
			console.log('Папка существует? ', dir_exist);
			if( !dir_exist ){
				//создание папки
				try{
					await fs.mkdir(dir);
					console.log(`Папка ${dir} успешно создана`);
				}
				catch(err){
					console.log(`Ошибка создания папки ${dir}. Error: ${err}`);
					return;
				}
			};
			const file_ext = path.extname(current_file.filename); // расширение
			const file_name = `${Date.now()}_-_${current_file.filename}`; // имя
			const number = Math.floor(Math.random()*1000000);
			const new_full_name = `${Date.now()}_-_file${number}${file_ext}`; // новое full имя
			const new_file_name = `file${number}${file_ext}`;
			const file_path = path.join(dir, new_full_name); // путь
			try{
				await fs.writeFile(file_path, await current_file.toBuffer());
				console.log(`Файл ${new_full_name} загружен в папку ${my_id} по пути ${file_path}`);
			}
			catch(err){
				return console.log('Не удалось загрузить файл ',file.filename,'. Ошибка: ', err);
			};
			console.log('+')
			console.log(`file_name = ${file_name}`);
			console.log(`new_file_name = ${new_file_name}`)
			console.log(`current_file.filename = ${current_file.filename}`)
			console.log(`file_path = ${file_path}`)
			return reply.send({
				message: 'Предварительный файл загружен!',
				loaded: true,
				loaded_file: {
					full_name: new_full_name,
					file_name: new_file_name,
					file_path: file_path,
				},
				file_index: file_index || 'empty',
			})
		}
		else{
			// СТАРОЕ ИЗОБРАЖЕНИЕ
			console.log('++')
			console.log('loaded_file = ', JSON.parse(file()?.value)?.old_file?.data?.loaded_file)
			return reply.send({
				message: 'Предварительный файл загружен!',
				loaded: true,
				loaded_file: JSON.parse(file()?.value)?.old_file?.data?.loaded_file,
				file_index: file_index || 'empty',

			})
		}
		// В ОБЩЕМ ЭТО РАБОТАЕТ, ОН ОПРЕДЕЛЯЕТ СТАРЫЕ ИЗОБРАЖЕНИЯ И НОВЫЕ, ЗАГРУЖАЕТ НОВЫЕ ДЛЯ ПОСТОВ, НО ПОКА НЕ ДОБАВЛЯЕТ НОВЫЕ ИЗОБРАЖЕНИЯ К СУЩЕСТВУЮЩИМ
		// НУЖНО ЭТО НАСТРОИТЬ
		// + Я СЛОМАЛ СМЕНУ ГОТОВЫХ ИЗОБРАЖЕНИЙ :(
	}
	catch(err){
		console.log('Ошибка предварительной загрузки файлов!', err);
		return reply.send({error: 'Ошибка предварительной загрузки файлов!', err});
	}
});

fastify.post('/pre_loader_files_for_current_mails', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const other_id = request?.body?.other_id?.value;
	if( !other_id ){
		return reply.status(401).send({error: 'Не передан ID другого пользователя'});
	};

	const file = ()=>{
		const f = request?.body?.file;
		if( f?.value === '[object Object]'){
			const parsed_f = JSON.parse(f);
			return parsed_f;
		}
		else{
			return f;
		}
	};
	if( !file ){
		console.log('Файл не передан')
	};

	console.log('ЗАГРУЖАЕМЫЙ ФАЙЛ = ', file);
	// return;
	const current_file = file();
	console.log('current_file = ', current_file);
	const file_index = request?.body?.file_index?.value;
	try{
		if( current_file?.type === 'file' ){
			// НОВОЕ ИЗОБРАЖЕНИЕ
			const folder = `../../src/images/max`;
			const dir = path.join(__dirname, folder);
			const dir_exist = await fs.access(dir)
			.then(()=>true)
			.catch(()=>false);
			console.log('Папка существует? ', dir_exist);
			if( !dir_exist ){
				//создание папки
				try{
					await fs.mkdir(dir);
					console.log(`Папка ${dir} успешно создана`);
				}
				catch(err){
					console.log(`Ошибка создания папки ${dir}. Error: ${err}`);
					return;
				}
			};
			const file_ext = path.extname(current_file.filename); // расширение
			const file_name = `${Date.now()}_-_${current_file.filename}`; // имя
			const number = Math.floor(Math.random()*1000000);
			const new_full_name = `${Date.now()}_-_file${number}_${my_id}_${other_id}_${file_ext}`; // новое full имя
			const new_file_name = `file${number}${file_ext}`;
			const file_path = path.join(dir, new_full_name); // путь
			try{
				await fs.writeFile(file_path, await current_file.toBuffer());
				console.log(`Файл ${new_full_name} загружен в папку ${my_id} по пути ${file_path}`);
			}
			catch(err){
				return console.log('Не удалось загрузить файл ',file.filename,'. Ошибка: ', err);
			};
			console.log('+')
			console.log(`file_name = ${file_name}`);
			console.log(`new_file_name = ${new_file_name}`)
			console.log(`current_file.filename = ${current_file.filename}`)
			console.log(`file_path = ${file_path}`)
			return reply.send({
				message: 'Предварительный файл загружен!',
				loaded: true,
				loaded_file: {
					name: new_full_name,
					file_name: new_file_name,
					path: file_path,
				},
				file_index: file_index || 'empty',
			})
		}
		else{
			// СТАРОЕ ИЗОБРАЖЕНИЕ
			console.log('++')
			console.log('loaded_file = ', JSON.parse(file()?.value)?.old_file?.data?.loaded_file)
			return reply.send({
				message: 'Предварительный файл загружен!',
				loaded: true,
				loaded_file: JSON.parse(file()?.value)?.old_file?.data?.loaded_file,
				file_index: file_index || 'empty',

			})
		}
		// В ОБЩЕМ ЭТО РАБОТАЕТ, ОН ОПРЕДЕЛЯЕТ СТАРЫЕ ИЗОБРАЖЕНИЯ И НОВЫЕ, ЗАГРУЖАЕТ НОВЫЕ ДЛЯ ПОСТОВ, НО ПОКА НЕ ДОБАВЛЯЕТ НОВЫЕ ИЗОБРАЖЕНИЯ К СУЩЕСТВУЮЩИМ
		// НУЖНО ЭТО НАСТРОИТЬ
		// + Я СЛОМАЛ СМЕНУ ГОТОВЫХ ИЗОБРАЖЕНИЙ :(
	}
	catch(err){
		console.log('Ошибка предварительной загрузки файлов!', err);
		return reply.send({error: 'Ошибка предварительной загрузки файлов!', err});
	}
});


fastify.post('/send_post_in_group', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const group_id = request?.body?.group_id?.value;
	if( !group_id ){
		console.log('id группы не передано [2637]');
		return reply.status(400).send({error: 'id группы не передано [2637]. group_id = ', group_id})
	};
	const files = request.body?.files?.value;
	if( files ){
		// console.log(files)
	}
	const text = request.body?.text?.value;
	if( !files && !text ){
		console.log('Данные не переданы');
		return reply.status(401).send({error: 'Данные не переданы'});
	};
	let type_group = '';
	const unique_token = request?.body?.unique_token?.value || '';
	console.log('[3315] unique_token = ', unique_token)

	// отправка
	if( !files && text ){
		type_group = 'text';
		// текст
		const new_post = new Post_Group_Schema({
			text: text || '',
			images: [],
			group_id: group_id,
			from: {
				name: my_user?.name || 'Ошибка',
				id: my_id,
				role: my_user?.role,
			},
			role: my_user?.role,
			type_post: type_group,
			unique_token: unique_token,
		});
		try{
			await new_post.save();
		}	
		catch(err){
			console.log('Ошибка сохранения. ', err);
			return;
		}
	}
	else if( files && !text ){
		console.log('files = ', files)
		type_group = 'img';
		// файлы
		const new_post = new Post_Group_Schema({
			text: '',
			images: files || console.log('Ошибка в images'),
			group_id: group_id || console.log('Ошибка в group_id'),
			from: {
				name: my_user?.name || console.log('Ошибка в name'),
				id: my_id || console.log('Ошибка в id'),
			},
			role: my_user?.role || 'роль не указана',
			type_post: type_group,
			unique_token: unique_token,
		});
		try{
			await new_post.save();
		}	
		catch(err){
			console.log('Ошибка сохранения. ', err);
			return;
		}
	}
	else if( files && text ){
		type_group = 'img_and_text';
		// файлы и текст
		const new_post = new Post_Group_Schema({
			text: text || console.log('Ошибка в text'),
			images: files || console.log('Ошибка в images'),
			group_id: group_id || console.log('Ошибка в group_id'),
			from: {
				name: my_user?.name || console.log('Ошибка в name'),
				id: my_id || console.log('Ошибка в id'),
			},
			role: my_user?.role || 'роль не указана',
			type_post: type_group,
			unique_token: unique_token,
		});
		try{
			await new_post.save();
		}	
		catch(err){
			console.log('Ошибка сохранения. ', err);
			return;
		}
	};
	console.log('Пост отправлен!');
	return reply.send({
		message: 'Пост отправлен!',
		refresh: true,
	})
});

fastify.post('/send_post_in_user_page', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const user_page_id = request?.body?.user_page_id?.value;
	if( !user_page_id ){
		console.log('id user_page не передано');
		return reply.status(400).send({error: 'id user_page не передано. user_page_id = ', group_id})
	};
	const files = request.body?.files?.value;
	if( files ){
		// console.log(files)
	}
	const text = request.body?.text?.value;
	if( !files && !text ){
		console.log('Данные не переданы');
		return reply.status(401).send({error: 'Данные не переданы'});
	};
	let type_content = '';
	const unique_token = request?.body?.unique_token?.value || '';
	console.log('[3437] unique_token = ', unique_token)

	// отправка
	if( !files && text ){
		type_content = 'text';
		// текст
		const new_post = new Post_User_Page_Schema({
			text: text || '',
			images: [],
			user_page_id: user_page_id,
			from: {
				name: my_user?.name || 'Ошибка',
				id: my_id,
				role: my_user?.role,
			},
			role: my_user?.role,
			type_post: type_content,
			unique_token: unique_token,
		});
		try{
			await new_post.save();
		}	
		catch(err){
			console.log('Ошибка сохранения. ', err);
			return;
		}
	}
	else if( files && !text ){
		console.log('files = ', files)
		type_content = 'img';
		// файлы
		const new_post = new Post_User_Page_Schema({
			text: '',
			images: files || console.log('Ошибка в images'),
			user_page_id: user_page_id || console.log('Ошибка в user_page_id'),
			from: {
				name: my_user?.name || console.log('Ошибка в name'),
				id: my_id || console.log('Ошибка в id'),
			},
			role: my_user?.role || 'роль не указана',
			type_post: type_content,
			unique_token: unique_token,
		});
		try{
			await new_post.save();
		}	
		catch(err){
			console.log('Ошибка сохранения. ', err);
			return;
		}
	}
	else if( files && text ){
		type_content = 'img_and_text';
		// файлы и текст
		const new_post = new Post_User_Page_Schema({
			text: text || console.log('Ошибка в text'),
			images: files || console.log('Ошибка в images'),
			user_page_id: user_page_id || console.log('Ошибка в user_page_id'),
			from: {
				name: my_user?.name || console.log('Ошибка в name'),
				id: my_id || console.log('Ошибка в id'),
			},
			role: my_user?.role || 'роль не указана',
			type_post: type_content,
			unique_token: unique_token,
		});
		try{
			await new_post.save();
		}	
		catch(err){
			console.log('Ошибка сохранения. ', err);
			return;
		}
	};
	console.log('Пост отправлен!');
	return reply.send({
		message: 'Пост отправлен!',
		refresh: true,
	})
});

fastify.post('/set_group_avatar', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const group_id = request?.body?.group_id.value;
	if( !group_id ){
		console.log('id группы не передано [2871]');
		return reply.status(400).send({error: 'id группы не передано [2871]. group_id = ', group_id})
	};
	let file = request.body.file;
	console.log('file = ', file)
	if( !file ){
		console.log('Ошибка: файл не передан');
		return reply.send({error: 'Ошибка:  файл не передан'});
	};
	// работа с файлом

	let name_loaded_file = ''; 

	if( file.filename !== '' && file.filename !== null && file.filename !== undefined ){
		try{
			const dir = path.join(__dirname, '../../src/images/groups_profils/');
			const dir_exist = await fs.access(dir)
			.then(()=>{return true})
			.catch((err)=>{return false});
			console.log('Папка groups_profils существует? ', dir_exist);
			if( !dir_exist ){
				return;
			};
			// const file_ext = path.extname(file.filename);
			// const file_name = `${Date.now()}${file_ext}`;
			// const file_path = path.join(dir, file_name);

			//сперва удаляем старую аватарку (если олна есть)
			try{
				const group = await Group_Schema.find({_id: group_id});
				if( !group ){
					console.log('Такой группы нет');
					return reply.send({error: 'Такой группы нет'});
				};
				const group_img = group[0]?.group_img;
				if( group_img ){
					console.log('group_img = ', group_img)
					// удаление аватарки группы с сервера
					try{
						const folder_path = '../../src/images/groups_profils/';
						const folder_exist = await fs.access(folder_path)
						.then(()=>true)
						.catch((err)=>false);
						console.log('Папка существует? ', folder_exist);
						if( folder_exist ){
							const files_ext = ['.jpg'];
							const folder_files = await fs.readdir(folder_path);
							const images = folder_files.filter(file=>{
								const ext = '.' + file.split('.').pop();
								return files_ext.includes(ext);
							});
							if( images.length > 0 ){
								console.log('Найденные файлы = ', images);
								images.forEach((file, index) => {
									if( file === group_img ){
										console.log(`Нашёл совпадение! index = ${index}, file [${file}] = group_img [${group_img}]`);
										try{
											const remove_file = async (file) => {
												await fs.unlink(`${folder_path}/${file}`);
											}
											remove_file(file);
										}
										catch(err){
											console.log('Ошибка удаления: ', err);
										}
										console.log('Файл удалён!');
									}
								})
							}
						}
					}
					catch(err){
						console.log('Ошибка удаления аватарки группы: ', err);
						return reply.send({error: 'Ошибка удаления аватарки группы: ', err});
					}
				}
			}
			catch(err){
				console.log('Ошибка удаления старой аватарки (если она была): ', err);
				return reply.send({error: 'Ошибка удаления старой аватарки: ', err});
			}
			const file_ext = path.extname(file.filename); // расширение
			const file_name = `${Date.now()}_-_${file.filename}`; // имя
			const number = Math.floor(Math.random()*1000000);
			const new_full_name = `${Date.now()}_-_avatar${number}${file_ext}`; // новое full имя
			const new_file_name = `avatar${number}${file_ext}`;
			const file_path = path.join(dir, new_full_name); // путь

			await fs.writeFile(file_path, await file.toBuffer());
			console.log(`Изображение загружено в папку groups_profils. (${new_full_name})`);
			name_loaded_file = new_full_name;
			file = '';
		}
		catch(err){
			console.log('Ошибка: file error. ', err);
			return reply.status(400).send({error: 'Ошибка: file error', err});
		};

		try{
			const group = await Group_Schema.find({_id: group_id});
			if( !group ){
				console.log('Такой группы нет');
				return reply.send({error: 'Такой группы нет'});
			};
			await Group_Schema.updateOne({_id: group_id},{
				$set: {
					group_img: name_loaded_file,
				}
			});
			return reply.send({
				message: 'Изображение изменено',
				refresh: true,
			})
		}
		catch(err){
			console.log('/set_group_avatar: Ошибка: ', err);
			return reply.status(400).send({error: 'Ошибка: ', err});
		}
	}
});

fastify.post('/set_header_group', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const group_id = request?.body?.group_id.value;
	if( !group_id ){
		console.log('id группы не передано [3019]');
		return reply.status(400).send({error: 'id группы не передано [3019]. group_id = ', group_id})
	};
	let file = request.body.file;
	console.log('file = ', file)
	if( !file ){
		console.log('Ошибка: файл не передан');
		return reply.send({error: 'Ошибка:  файл не передан'});
	};
	// работа с файлом

	let name_loaded_file = ''; 

	if( file.filename !== '' && file.filename !== null && file.filename !== undefined ){
		try{
			const dir = path.join(__dirname, '../../src/images/groups_headers/');
			const dir_exist = await fs.access(dir)
			.then(()=>{return true})
			.catch((err)=>{return false});
			console.log('Папка groups_headers существует? ', dir_exist);
			if( !dir_exist ){
				try{
					await fs.mkdir(dir);
					console.log('Папка ', dir, ' создана');
				}
				catch(err){
					console.log('Ошибка созданий папки ', dir);
					return reply.send({error: 'Ошибка создания папки ', dir});
				}
			};
			// const file_ext = path.extname(file.filename);
			// const file_name = `${Date.now()}${file_ext}`;
			// const file_path = path.join(dir, file_name);

			//сперва удаляем старую шапку (если олна есть)
			try{
				const group = await Group_Schema.find({_id: group_id});
				if( !group ){
					console.log('Такой группы нет');
					return reply.send({error: 'Такой группы нет'});
				};
				const group_header = group[0]?.group_header;
				if( group_header ){
					console.log('group_header = ', group_header)
					// удаление шапки группы с сервера
					try{
						const folder_path = '../../src/images/groups_headers/';
						const folder_exist = await fs.access(folder_path)
						.then(()=>true)
						.catch((err)=>false);
						console.log('Папка существует? ', folder_exist);
						if( folder_exist ){
							const files_ext = ['.jpg'];
							const folder_files = await fs.readdir(folder_path);
							const images = folder_files.filter(file=>{
								const ext = '.' + file.split('.').pop();
								return files_ext.includes(ext);
							});
							if( images.length > 0 ){
								console.log('Найденные файлы = ', images);
								images.forEach((file, index) => {
									if( file === group_header ){
										console.log(`Нашёл совпадение! index = ${index}, file [${file}] = group_img [${group_header}]`);
										try{
											const remove_file = async (file) => {
												await fs.unlink(`${folder_path}/${file}`);
											}
											remove_file(file);
										}
										catch(err){
											console.log('Ошибка удаления: ', err);
										}
										console.log('Файл удалён!');
									}
								})
							}
						}
					}
					catch(err){
						console.log('Ошибка удаления шапки группы: ', err);
						return reply.send({error: 'Ошибка удаления шапки группы: ', err});
					}
				}
			}
			catch(err){
				console.log('Ошибка удаления старой шапки (если она была): ', err);
				return reply.send({error: 'Ошибка удаления старой шапки: ', err});
			}

			const file_ext = path.extname(file.filename); // расширение
			const file_name = `${Date.now()}_-_${file.filename}`; // имя
			const number = Math.floor(Math.random()*1000000);
			const new_full_name = `${Date.now()}_-_header${number}${file_ext}`; // новое full имя
			const new_file_name = `header${number}${file_ext}`;
			const file_path = path.join(dir, new_full_name); // путь

			await fs.writeFile(file_path, await file.toBuffer());
			console.log(`Изображение загружено в папку groups_headers. (${new_full_name})`);
			name_loaded_file = new_full_name;
			file = '';
		}
		catch(err){
			console.log('Ошибка: file error. ', err);
			return reply.status(400).send({error: 'Ошибка: file error', err});
		};

		try{
			const group = await Group_Schema.find({_id: group_id});
			if( !group ){
				console.log('Такой группы нет');
				return reply.send({error: 'Такой группы нет'});
			};
			await Group_Schema.updateOne({_id: group_id},{
				$set: {
					group_header: name_loaded_file,
				}
			});
			return reply.send({
				message: 'Изображение изменено',
				refresh: true,
			})
		}
		catch(err){
			console.log('/set_header_group: Ошибка: ', err);
			return reply.status(400).send({error: 'Ошибка: ', err});
		}
	}
});

fastify.post('/remove_group_header', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const group_id = request?.body?.group_id;
	if( !group_id ){
		console.log('id группы не передано [3175]');
		return reply.status(400).send({error: 'id группы не передано [3175]. group_id = ', group_id})
	};
	try{
		//
		//сперва удаляем старую шапку (если олна есть)
		try{
			const group = await Group_Schema.find({_id: group_id});
			if( !group ){
				console.log('Такой группы нет');
				return reply.send({error: 'Такой группы нет'});
			};
			const group_header = group[0]?.group_header;
			if( group_header ){
				console.log('group_header = ', group_header)
				// удаление шапки группы с сервера
				try{
					const folder_path = '../../src/images/groups_headers/';
					const folder_exist = await fs.access(folder_path)
					.then(()=>true)
					.catch((err)=>false);
					console.log('Папка существует? ', folder_exist);
					if( folder_exist ){
						const files_ext = ['.jpg'];
						const folder_files = await fs.readdir(folder_path);
						const images = folder_files.filter(file=>{
							const ext = '.' + file.split('.').pop();
							return files_ext.includes(ext);
						});
						if( images.length > 0 ){
							console.log('Найденные файлы = ', images);
							images.forEach((file, index) => {
								if( file === group_header ){
									console.log(`Нашёл совпадение! index = ${index}, file [${file}] = group_img [${group_header}]`);
									try{
										const remove_file = async (file) => {
											await fs.unlink(`${folder_path}/${file}`);
										}
										remove_file(file);
									}
									catch(err){
										console.log('Ошибка удаления: ', err);
									}
									console.log('Файл удалён!');
								}
							})
						}
					}
				}
				catch(err){
					console.log('Ошибка удаления шапки группы: ', err);
					return reply.send({error: 'Ошибка удаления шапки группы: ', err});
				}
			}
		}
		catch(err){
			console.log('Ошибка удаления старой шапки (если она была): ', err);
			return reply.send({error: 'Ошибка удаления старой шапки: ', err});
		}
		//

		const group = await Group_Schema.findOne({_id: group_id});
		if( !group ){
			return reply.send({message: 'Такой группы нет'});
		};
		await Group_Schema.updateOne({_id: group_id},{
			$set: {
				group_header: '',
			}
		});
		console.log('Шапка удалена');
		return reply.send({
			message: 'Шапка удалена',
			refresh: true,
		})
	}
	catch(err){
		console.log('Ошибка: ', err);
		return reply.send({error: 'Ошибка: ', err});
	}
});

fastify.post('/remove_group_avatar', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const group_id = request?.body?.group_id;
	if( !group_id ){
		console.log('id группы не передано [3284]');
		return reply.status(400).send({error: 'id группы не передано [3284]. group_id = ', group_id})
	};
	try{
		//
		//сперва удаляем старую аватарку (если олна есть)
		try{
			const group = await Group_Schema.find({_id: group_id});
			if( !group ){
				console.log('Такой группы нет');
				return reply.send({error: 'Такой группы нет'});
			};
			const group_img = group[0]?.group_img;
			if( group_img ){
				console.log('group_img = ', group_img)
				// удаление аватарки группы с сервера
				try{
					const folder_path = '../../src/images/groups_profils/';
					const folder_exist = await fs.access(folder_path)
					.then(()=>true)
					.catch((err)=>false);
					console.log('Папка существует? ', folder_exist);
					if( folder_exist ){
						const files_ext = ['.jpg'];
						const folder_files = await fs.readdir(folder_path);
						const images = folder_files.filter(file=>{
							const ext = '.' + file.split('.').pop();
							return files_ext.includes(ext);
						});
						if( images.length > 0 ){
							console.log('Найденные файлы = ', images);
							images.forEach((file, index) => {
								if( file === group_img ){
									console.log(`Нашёл совпадение! index = ${index}, file [${file}] = group_img [${group_img}]`);
									try{
										const remove_file = async (file) => {
											await fs.unlink(`${folder_path}/${file}`);
										}
										remove_file(file);
									}
									catch(err){
										console.log('Ошибка удаления: ', err);
									}
									console.log('Файл удалён!');
								}
							})
						}
					}
				}
				catch(err){
					console.log('Ошибка удаления аватарки группы: ', err);
					return reply.send({error: 'Ошибка удаления аватарки группы: ', err});
				}
			}
		}
		catch(err){
			console.log('Ошибка удаления старой аватарки (если она была): ', err);
			return reply.send({error: 'Ошибка удаления старой аватарки: ', err});
		}
		//
		const group = await Group_Schema.findOne({_id: group_id});
		if( !group ){
			return reply.send({message: 'Такой группы нет'});
		};
		await Group_Schema.updateOne({_id: group_id},{
			$set: {
				group_img: '',
			}
		});
		console.log('Аватар группы удалён')
		return reply.send({
			message: 'Аватар группы удалён',
			refresh: true,
		})
	}
	catch(err){
		console.log('Ошибка: ', err);
		return reply.send({error: 'Ошибка: ', err});
	}
});

fastify.post('/remove_account_profil_avatar', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};

	try{
		const old_avatar_name = my_user.profil_avatar !== null || '' ? my_user.profil_avatar : '';
		const default_img_path = '../../src/images/default/default_avatar/empty.jpg';
		const default_path = path.join(__dirname, default_img_path);
		const new_img_path = path.join(__dirname, '../../src/images/profils/');
		const new_img_name = `${Date.now()}_-_empty.jpg`;
		const new_full_img_path = path.join(new_img_path, new_img_name);
		// копирование дефолтной фотки
		try{
			await fs.copyFile(default_img_path, new_full_img_path);
		}
		catch(err){
			console.log('Ошибка копирования дефолтной аватарки: ', err);
			return reply.send({error: 'Ошибка копирования дефолтной аватарки: ',err});
		}
		// удаление старой аватарки
		// проверка папки
		const old_folder = path.join(__dirname, '../../src/images/profils');
		const old_path_exist = await fs.access(old_folder)
		.then(()=>true)
		.catch((err)=>false);
		console.log('Старая папка существует? ', old_path_exist);

		//проверка файла в папке
		const old_avatar_path = path.join(old_folder, old_avatar_name);
		const old_avatar_exist = await fs.access(old_avatar_path)
		.then(()=>true)
		.catch((err)=>false);
		console.log('Старая аватарка существует? ', old_avatar_exist);
		// заменяем данные
		try{
			await User_Schema.updateOne({_id: my_id},{
				$set: {
					profil_avatar: new_img_name,
				}
			})
		}
		catch(err){
			console.log('Ошибка замены данных: ', err);
			return reply.send({error: 'Ошибка замены данных: ', err});
		}
		// удаляем
		try{
			console.log('_______      old_avatar_name       _______ = ', old_avatar_name);
			await fs.unlink(old_avatar_path);
			console.log('Старая аватарка удалена');
			// return reply.send({message: 'Старая аватарка удалена', refresh: true})
		}
		catch(err){
			console.log('Ошибка удаления старой аватарки: ', err);
			return reply.send({error: 'Ошибка удаления старой аватарки: ', err})
		}

		// применение изменений к группам
		try{
			console.log('ПОИСК ГРУПП')
			// поиск по старой аватарке и замена на новую
			const groups = await Group_Schema.find();
			if( groups.length > 0 ){
				console.log('ГРУППЫ НАЙДЕНЫ')
				groups.forEach( async group => {
					console.log('РАЗБОР ГРУППЫ ', group)
					console.log('OLD_AVATAR_NAME = ', old_avatar_name);

					group?.group_members.forEach( async member => {
						if( member?.profil_avatar === old_avatar_name ){
							await Group_Schema.updateMany({
								_id: group?._id
							},{
								$set: {
									'group_members.$[member]':{
										...member,
										'profil_avatar': new_img_name
									}
								}
							},{
								arrayFilters: [
									{
										'member.profil_avatar': old_avatar_name
									}
								]
							})
						}
					})

				})
			}
		}
		catch(err){
			console.log('Ошибка применения изменений к группам: ', err);
			return reply.send({error: 'Ошибка применения изменений к группам: ', err})
		}

		if( old_avatar_name !== null && old_folder && old_avatar_path && old_avatar_exist ){
			try{
				await fs.unlink(old_avatar_path, old_avatar_name);
				console.log('Старая аватарка успешно удалена!');
			}
			catch(err){
				console.log('Не удалось удались старую аватарку! ', err);
			}
		}

		return reply.send({
			message: 'Аватарка загружена на сервер',
			file_name: new_img_name,
			refresh: true,
		})
	}
	catch(err){
		console.log('Ошибка загрузки новой аватарки на сервер! ', err);
		return reply.status(401).send({error: 'Ошибка загрузки новой аватарки на сервер! ', err});
	}
});

fastify.post('/set_default_profil_avatar_for_all_users', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	try{
		const default_path = '../../src/images/default/default_avatar/empty.jpg';
		const default_avatar = path.join(__dirname, default_path);
		const default_avatar_exist = await fs.access(default_avatar)
		.then(()=>true)
		.catch((err)=>false);
		console.log('Дефолтная аватарка существует? ', default_avatar_exist);
		if( !default_avatar_exist ){
			return console.log('Аватарка не существует!')
		};

		// ГЛОБАЛЬНЫЙ АВАТАР

		// const test_users = await User_Schema.find();
		// if( test_users.length > 0 ){
		// 	test_users.forEach(async t_user => {
		// 		console.log('t_user = ', t_user);
		// 		if( t_user?.profil_avatar !== null ){
		// 			await User_Schema.updateOne({_id: t_user?._id},{
		// 				$set: {
		// 					profil_avatar: null,
		// 				}
		// 			})
		// 		}
		// 	})
		// };

		// поиск всех пользователей, у которых нет аватарки
		const users = await User_Schema.find({profil_avatar: null});
		if( users.length > 0 ){
			users.forEach( async (user) => {
				// имя дефолтной аватарки
				const default_avatar_name = `${Date.now()}_-_empty.jpg`;
				const new_avatar_path = path.join(__dirname, '../../src/images/profils/');
				const new_full_path = path.join(new_avatar_path, default_avatar_name);

				await User_Schema.updateOne({
					_id: user._id, 
				},{
					$set: {
						profil_avatar: default_avatar_name,
					}	
				});
				
				try{
					// копирование дефолтной фотки для каждого пользователя без аватарки
					await fs.copyFile(default_avatar, new_full_path);
					console.log('Всё ок!');
				}
				catch(err){
					console.log('Ошибка копирования: ', err);
					return reply.send({error: 'Ошибка копирования: ', err});
				}
			})
		} else {
			console.log('Пользователей с profil_avatar: null - нет')
		}
	}
	catch(err){
		console.log('Ошибка установки дефолтных аватаров для пользователей без аватаров');
		return reply.send({error:'Ошибка установки дефолтных аватаров для пользователей без аватаров'});
	}
});

fastify.post('/remove_all_posts', async (request, reply) => {
	const group_id = request.body?.group_id;
	if( !group_id ){
		return console.log('Ошибка group_id')
	}
	try{
		const posts = await Post_Group_Schema.find();
		console.log(posts)
		const arr_posts = Array.from(posts);
		arr_posts.map(async post => {
			try{
				await Post_Group_Schema.deleteMany({_id: post?._id})
				console.log(`Пост [${post?._id}] удалён`)
			}
			catch(err){
				console.log('Не смог удалить пост ', post?._id)
			}
		})
	}
	catch(err){
		console.log('Ошибка удаления: ', err)
	}
});

fastify.post('/get_posts', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const group_id = request?.body?.group_id;
	if( !group_id ){
		console.log('id группы не передано [3646]');
		return reply.status(400).send({error: 'id группы не передано [3646]. group_id = ', group_id})
	};
	try{
		const posts = await Post_Group_Schema.find({group_id: group_id});
		if( posts.length === 0 ){
			return;
		};
		return reply.send({
			message: 'Посты получены',
			posts: posts,
			refresh: true,
		})
	}
	catch(err){
		console.log('Ошибка получения постов, ', err);
		return reply.send({error: 'Ошибка получения постов, ', err});
	}
});

fastify.post('/get_user_page_posts', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const user_page_id = request?.body?.user_page_id;
	if( !user_page_id ){
		console.log('id группы не передано');
		return reply.status(400).send({error: 'id группы не передано. group_id = ', group_id})
	};
	try{
		const posts = await Post_User_Page_Schema.find({user_page_id: user_page_id});
		if( posts.length === 0 ){
			return;
		};
		return reply.send({
			message: 'Посты получены',
			posts: posts,
			refresh: true,
		})
	}
	catch(err){
		console.log('Ошибка получения постов, ', err);
		return reply.send({error: 'Ошибка получения постов, ', err});
	}
});

fastify.post('/total_delete_img', async (request, reply) => {
	console.log('/total_delete_img')
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const group_id = request?.body?.group_id;
	if( !group_id ){
		console.log('id группы не передано');
		return reply.status(400).send({error: 'id группы не передано. group_id = ', group_id})
	};
	const content_id = request.body?.content_id;
	if( !content_id ){
		console.log('id контента не передано');
		return reply.status(400).send({error: 'id контента не передано. content_id = ', content_id});
	};
	const old_file = JSON.parse(request?.body?.old_file);
	if( !old_file ){
		console.log('Данные файла не переданы');
		return reply.send({error: 'Данные файла не переданы'});
	}
	try{
		// поиск файлов
		const files_exist = await fs.access(old_file?.file_path)
		.then(()=>true)
		.catch((err)=>false);
		if( files_exist ){
			await fs.unlink(old_file?.file_path);
			console.log('++++++++')
		}
		else {
			console.log('Файлов нет')
		}
	}
	catch(err){
		console.log('Ошибка удаления файла: ', err);
	}

});

fastify.post('/total_delete_img_for_user_page', async (request, reply) => {
	console.log('/total_delete_img_for_user_page')
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const user_page_id = request?.body?.user_page_id;
	if( !user_page_id ){
		console.log('id группы не передано');
		return reply.status(400).send({error: 'id user_page не передано. user_page_id = ', user_page_id})
	};
	const content_id = request.body?.content_id;
	if( !content_id ){
		console.log('id контента не передано');
		return reply.status(400).send({error: 'id контента не передано. content_id = ', content_id});
	};
	const old_file = JSON.parse(request?.body?.old_file);
	if( !old_file ){
		console.log('Данные файла не переданы');
		return reply.send({error: 'Данные файла не переданы'});
	}
	try{
		// поиск файлов
		const files_exist = await fs.access(old_file?.file_path)
		.then(()=>true)
		.catch((err)=>false);
		if( files_exist ){
			await fs.unlink(old_file?.file_path);
			console.log('++++++++')
		}
		else{console.log('Файлов нет')}
	}
	catch(err){
		console.log('Ошибка удаления файла: ', err);
	}
});

fastify.post('/total_delete_img_for_current_mails', async (request, reply) => {
	console.log('//total_delete_img_for_current_mails')
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	};
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const other_id = request.body?.other_id;
	if( !other_id ){
		console.log('id other_id не передано. other_id = ', other_id);
		return reply.status(400).send({error: 'id other_id другого пользователя не передано. other_id = ', other_id});
	};
	const for_current_mails = request.body?.for_current_mails;
	if( !for_current_mails ){
		console.log('Удаление не возможно! for_current_mails = ', for_current_mails);
		return reply.send({message: 'Удаление не возможно! for_current_mails = ', for_current_mails});
	};
	const content_id = request.body?.content_id;
	if( !content_id ){
		console.log('id контента не передано');
		return reply.status(400).send({error: 'id контента не передано. content_id = ', content_id});
	};
	const old_file = JSON.parse(request?.body?.old_file);
	if( !old_file ){
		console.log('Данные файла не переданы');
		return reply.send({error: 'Данные файла не переданы'});
	}
	try{
		console.log('_1_')
		console.log('ПОИСК ФАЙЛА ПО УКАЗАННОМУ ПУТИ: ', old_file[0]?.old_file);
		// поиск файлов
		const pathDir = path.resolve(__dirname, `../../src/images/max/`);
		console.log('_2_')
		await fs.readdir(pathDir, (err)=>{
			if( err ){
				console.error('Ошибка пути: ', pathDir, '. Ошибка: ', err);
				return;
			}
		});
		console.log('_3_')
		// разбор на атомы 
		const old_file_static = old_file[0]?.old_file?.data?.loaded_file;
		const files_exist = await fs.access(old_file_static?.path)
		.then(()=>true)
		.catch((err)=>false);
		console.log('_4_')
		console.log('files_exist = ', files_exist);
		if( files_exist ){
			await fs.unlink(old_file_static?.path);
			console.log(`*********** Файл ${old_file_static?.name} удалён ***********`);
		}
		else{console.log('Файлов нет')}
	}
	catch(err){
		console.log(`Ошибка удаления файла: `, err);
	}
});

fastify.post('/remove_content', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const group_id = request?.body?.group_id;
	if( !group_id ){
		console.log('id группы не передано');
		return reply.status(400).send({error: 'id группы не передано. group_id = ', group_id})
	};
	const content_id = request.body?.content_id;
	if( !content_id ){
		console.log('id контента не передано');
		return reply.status(400).send({error: 'id контента не передано. content_id = ', content_id});
	};
	try{
		const current_group = await Group_Schema.find({_id: group_id});
		if( !current_group ){
			console.log('Ошибка: Группа не существует');
			return reply.send({error: 'Ошибка:  Группа не существует'});
		};
		const current_content = await Post_Group_Schema.find({_id: content_id});
		if( !current_content ){
			console.log('Ошибка: Контент не найден');
			return reply.send({error: 'Ошибка:  Контент не найден'});
		};
		await Post_Group_Schema.deleteOne({_id: content_id});
		console.log('Контент удалён')
	}
	catch(err){
		console.log('Ошибка удаления контента: ', err);
		return reply.status(401).send({error: 'Ошибка удаления поста: ', err});
	}
	return reply.send({
		message: 'Контент удалён',
		refresh: true,
	});
});

fastify.post('/remove_content_user_page', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const user_page_id = request?.body?.user_page_id;
	if( !user_page_id ){
		console.log('id группы не передано');
		return reply.status(400).send({error: 'id user_page не передано. user_oage_id = ', user_page_id})
	};
	const content_id = request.body?.content_id;
	if( !content_id ){
		console.log('id контента не передано');
		return reply.status(400).send({error: 'id контента не передано. content_id = ', content_id});
	};
	try{
		const current_user_page = await User_Page_Schema.find({page_id: user_page_id});
		if( !current_user_page ){
			console.log('Ошибка: Страница не существует');
			return reply.send({error: 'Ошибка:  Страница не существует'});
		};
		const current_content = await Post_User_Page_Schema.find({_id: content_id});
		if( !current_content ){
			console.log('Ошибка: Контент не найден');
			return reply.send({error: 'Ошибка:  Контент не найден'});
		};
		await Post_User_Page_Schema.deleteOne({_id: content_id});
		console.log('Контент удалён')
	}
	catch(err){
		console.log('Ошибка удаления контента: ', err);
		return reply.status(401).send({error: 'Ошибка удаления поста: ', err});
	}
	return reply.send({
		message: 'Контент удалён',
		refresh: true,
	});
});

fastify.post('/remove_all_posts_in_user_page', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const user_page_id = request?.body?.user_page_id;
	if( !user_page_id ){
		console.log('Проблема с group_id');
		return reply.send({error: 'Проблема с user_page_id'})
	};
	try{
		await User_Page_Schema.updateOne({post_id: user_page_id},{
			$set:{
				posts: [],
			}
		});
		await Post_User_Page_Schema.deleteMany({user_page_id: user_page_id})
		console.log('Посты удалены');
		return reply.send({
			message: 'Посты удалены',
			refresh: true,
		})
	}
	catch(err){
		console.log('Ошибка удаления: ', err);
		return reply.send({error: 'Ошибка удаления: ', err});
	}
});

fastify.post('/change_content_user_page', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const user_page_id = request?.body?.user_page_id.value;
	const content_id = request?.body?.content_id.value;
	if( !user_page_id ){
		console.log('Проблема с group_id');
		return reply.send({error: 'Проблема с user_page_id'})
	};
	if( !content_id ){
		console.log('Проблема с content_id');
		return reply.send({error: 'Проблема с content_id'});
	};
	const raw_files = request?.body?.files;
	let files = '';
	if( raw_files ){
		files = JSON.parse(request?.body?.files?.value);
	};
	const text = request?.body?.text?.value;
	const type_content = request?.body?.type_content?.value;

	if( !type_content ){
		console.log('Ошибка type_content');
		return reply.send({error: 'Ошибка type_content'});
	};
	try{
		//поиск user_page
		const find_group = await User_Page_Schema.findOne({page_id: user_page_id});
		if( !find_group ){
			console.log('Не нашёл группу с id ', user_page_id);
			return reply.send({error: 'Не нашёл контент с id ', user_page_id});
		};
		//поиск контента
		const find_content = await Post_User_Page_Schema.findOne({_id: content_id});
		if( !find_content ){
			console.log('Не нашёл контент с id ', content_id);
			return reply.send({error: 'Не нашёл контент с id ', content_id});
		};
		//изменение контента
		//вроде бы можно обновлять данные на сервере
		if( type_content === 'img' && files.length > 0 ){
			await Post_User_Page_Schema.updateOne({_id: content_id},{
				$set:{
					images: JSON.stringify(files),
					changed: true,
				}
			});
			console.log(`Контент [${content_id}] изменён`);
			console.log('////////////////////////////////////')
			for(let i = 0; i < 20; i ++ ){
				console.log()
			}
			return reply.send({
				message: 'Контент изменён',
				refresh: true,
			});
		}
		else if( type_content === 'text' && text.length > 0 ){
			await Post_User_Page_Schema.updateOne({_id: content_id},{
				$set:{
					text: text,
					changed: true,
				}
			});
			console.log(`Контент [${content_id}] изменён`);
			console.log('////////////////////////////////////')
			for(let i = 0; i < 20; i ++ ){
				console.log()
			}
			return reply.send({
				message: 'Контент изменён',
				refresh: true,
			});
		}
		else if( type_content === 'img_and_text' && files.length > 0 && text.length > 0 ){
			await Post_User_Page_Schema.updateOne({_id: content_id},{
				$set:{
					images: JSON.stringify(files),
					text: text,
					changed: true,
				},
			});
			console.log(`Контент [${content_id}] изменён`);
			console.log('////////////////////////////////////')
			for(let i = 0; i < 20; i ++ ){
				console.log()
			}
			return reply.send({
				message: 'Контент изменён',
				refresh: true,
			});
		}
	}
	catch(err){
		console.log('Ошибка изменения контента: ',err);
		return reply.send({error: 'Ошибка изменения контента: ', err});
	}
});	

fastify.post('/change_content_for_current_mails', async (request, reply) => {
	console.log('change_content_for_current_mails')
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const content_id = request?.body?.content_id.value;
	if( !content_id ){
		console.log('Проблема с content_id');
		return reply.send({error: 'Проблема с content_id'});
	};
	const raw_files = request?.body?.files?.value && JSON.parse(request?.body?.files?.value) || null;
	console.log('raw_files = ', raw_files);
	let files = '';
	if( raw_files ){
		files = JSON.parse(request?.body?.files?.value);
		console.log('4528 [change_content_for_current_mails] files = ', files);
		console.log('4529 loaded_file = ', files[0]?.data?.loaded_file);
	};
	const text = request?.body?.text?.value;
	const type_content = request?.body?.type_content?.value;

	if( !type_content ){
		console.log('Ошибка type_content');
		return reply.send({error: 'Ошибка type_content'});
	};
	try{
		//поиск mail

		console.log('[4541] 1')
		const mails = await Message_Schema.find();
		console.log('content_id = ', content_id);
		console.log('сообщения = ', mails);
		const find_content = await Message_Schema.findOne({_id: content_id});
		if( !find_content ){
			console.log('Не нашёл контент с id ', content_id);
			return reply.send({error: 'Не нашёл контент с id ', content_id});
		};

		console.log('[4549] 2')

		//изменение контента
		//вроде бы можно обновлять данные на сервере
		if( type_content === 'img' && files.length > 0 ){

		console.log('[4555] 3')

			await Message_Schema.updateOne({_id: content_id},{
				$set:{
					img: JSON.stringify(files),
					changed: true,
				}
			});
			console.log(`Контент [${content_id}] изменён`);
			console.log('////////////////////////////////////')
			for(let i = 0; i < 20; i ++ ){
				console.log()
			}
			return reply.send({
				message: 'Контент изменён',
				refresh: true,
			});
		}
		else if( type_content === 'text' && text.length > 0 ){

			console.log('4')
			console.log('[4569] text = ', text);

			await Message_Schema.updateOne({_id: content_id},{
				$set:{
					message: text || '',
					changed: true,
				}
			});
			console.log(`Контент [${content_id}] изменён`);
			console.log('////////////////////////////////////')
			for(let i = 0; i < 20; i ++ ){
				console.log()
			}
			return reply.send({
				message: 'Контент изменён',
				refresh: true,
			});
		}
		else if( type_content === 'img_and_text' && files.length > 0 && text.length > 0 ){
			
			console.log('5')

			await Message_Schema.updateOne({_id: content_id},{
				$set:{
					img: JSON.stringify(files),
					message: text || '',
					changed: true,
				},
			});
			console.log(`Контент [${content_id}] изменён`);
			console.log('////////////////////////////////////')
			for(let i = 0; i < 20; i ++ ){
				console.log()
			}
			return reply.send({
				message: 'Контент изменён',
				refresh: true,
			});
		}
	}
	catch(err){
		console.log('Ошибка изменения контента: ',err);
		return reply.send({error: 'Ошибка изменения контента: ', err});
	}
});	

fastify.post('/change_content', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const group_id = request?.body?.group_id.value;
	const content_id = request?.body?.content_id.value;
	if( !group_id ){
		console.log('Проблема с group_id');
		return reply.send({error: 'Проблема с group_id'})
	};
	if( !content_id ){
		console.log('Проблема с content_id');
		return reply.send({error: 'Проблема с content_id'});
	};
	const raw_files = request?.body?.files;
	let files = '';
	if( raw_files ){
		files = JSON.parse(request?.body?.files?.value);
	};
	const text = request?.body?.text?.value;
	const type_content = request?.body?.type_content?.value;

	if( !type_content ){
		console.log('Ошибка type_content');
		return reply.send({error: 'Ошибка type_content'});
	};

	try{
		//поиск группы
		const find_group = await Group_Schema.findOne({_id: group_id});
		if( !find_group ){
			console.log('Не нашёл группу с id ', group_id);
			return reply.send({error: 'Не нашёл группу с id ', group_id});
		};
		//поиск контента
		const find_content = await Post_Group_Schema.findOne({_id: content_id});
		if( !find_content ){
			console.log('Не нашёл контент с id ', content_id);
			return reply.send({error: 'Не нашёл контент с id ', content_id});
		};
		//изменение контента
		//вроде бы можно обновлять данные на сервере
		if( type_content === 'img' && files.length > 0 ){
			await Post_Group_Schema.updateOne({_id: content_id},{
				$set:{
					images: JSON.stringify(files),
					changed: true,
				}
			});
			console.log(`Контент [${content_id}] изменён`);
			console.log('////////////////////////////////////')
			for(let i = 0; i < 20; i ++ ){
				console.log()
			}
			return reply.send({
				message: 'Контент изменён',
				refresh: true,
			});
		}
		else if( type_content === 'text' && text.length > 0 ){
			await Post_Group_Schema.updateOne({_id: content_id},{
				$set:{
					text: text,
					changed: true,
				}
			});
			console.log(`Контент [${content_id}] изменён`);
			console.log('////////////////////////////////////')
			for(let i = 0; i < 20; i ++ ){
				console.log()
			}
			return reply.send({
				message: 'Контент изменён',
				refresh: true,
			});
		}
		else if( type_content === 'img_and_text' && files.length > 0 && text.length > 0 ){
			await Post_Group_Schema.updateOne({_id: content_id},{
				$set:{
					images: JSON.stringify(files),
					text: text,
					changed: true,
				},
			});
			console.log(`Контент [${content_id}] изменён`);
			console.log('////////////////////////////////////')
			for(let i = 0; i < 20; i ++ ){
				console.log()
			}
			return reply.send({
				message: 'Контент изменён',
				refresh: true,
			});
		}
	}
	catch(err){
		console.log('Ошибка изменения контента: ',err);
		return reply.send({error: 'Ошибка изменения контента: ', err});
	}
});	

fastify.post('/hide_content_for_group', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const group_id = request.body?.group_id;
	if( !group_id ){
		console.log('ID группы не передан');
		return reply.status(401).send({error: 'ID группы не передан'});
	};
	const group = await Group_Schema.findOne({_id: group_id});
	if( !group ){
		console.log(`Группы с id [${group_id}] не существует`);
		return reply.send({error: `Группы с id [${group_id}] не существует`});
	};
	const content_id = request.body?.content_id;
	if( !content_id ){
		console.log('ID контента не передан');
		return reply.status(401).send({error: 'ID контента не передан'});
	};
	const content = await Post_Group_Schema.findOne({_id: content_id});
	if( !content ){
		console.log(`Контента с id [${content_id}] не существует`);
		return reply.send({error: `Контента с id [${content_id}] не существует`});
	};
	try{
		// hide
		if( content?.hide === 'false' ){
			await Post_Group_Schema.updateOne({_id: content_id, hide: 'false'},{
				$set: {
					hide: 'true',
				}
			})
			return reply.send({
				messageL: `Контент [${content_id}] скрыт`,
				refresh: 'true',
			});
		}
		// vis
		else if( content?.hide === 'true' ){
			await Post_Group_Schema.updateOne({_id: content_id, hide: 'true'},{
				$set: {
					hide: 'false',
				}
			})
			return reply.send({
				messageL: `Контент [${content_id}] скрыт`,
				refresh: true,
			});
		}
		else {
			await Post_Group_Schema.updateOne({_id: content_id },{
				$set: {
					hide: 'false',
				}
			})
			return reply.send({
				messageL: `Контент [${content_id}] виден`,
				refresh: true,
			});
		}
	}
	catch(err){
		console.log('Ошибка скрытия контента: ', err);
		return reply.send({error: 'Ошибка скрытия контента: ', err});
	}
});	

fastify.post('/hide_content_for_user_page', async (request, reply) => {
	// 
	// 
	// 2 в 1 - СКРЫВАЕТ И ВОЗВРАЩАЕТ ВИДИМОСТЬ
	// 
	// 
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const user_page_id = request.body?.user_page_id;
	if( !user_page_id ){
		console.log('ID user_page не передан');
		return reply.status(401).send({error: 'ID user_page не передан'});
	};
	const user_page = await User_Page_Schema.findOne({page_id: user_page_id});
	if( !user_page ){
		console.log(`Страница с id [${user_page_id}] не существует`);
		return reply.send({error: `Страница с id [${user_page_id}] не существует`});
	};
	const content_id = request.body?.content_id;
	if( !content_id ){
		console.log('ID контента не передан');
		return reply.status(401).send({error: 'ID контента не передан'});
	};
	const content = await Post_User_Page_Schema.findOne({_id: content_id});
	if( !content ){
		console.log(`Контента с id [${content_id}] не существует`);
		return reply.send({error: `Контента с id [${content_id}] не существует`});
	};
	console.log(`content = `, content)

	//	ПЕРЕДЕЛАТЬ String на Boolean для true и false

	try{ 
		// hide
		if( content?.hide === 'false' ){
			console.log('+')
			await Post_User_Page_Schema.updateOne({_id: content_id, hide: 'false'},{
				$set: {
					hide: 'true',
				}
			});
			return reply.send({
				message: `Контент [${content_id}] скрыт`,
				refresh: 'true',
			});
		}
		//  vis
		else if (content?.hide === 'true' ){
			console.log('++')
			await Post_User_Page_Schema.updateOne({_id: content_id, hide: 'true'},{
				$set: {
					hide: 'false',
				}
			});
			return reply.send({
				message: `Контент [${content_id}] виден`,
				refresh: 'true',
			});
		}
		else {
			await Post_User_Page_Schema.updateOne({_id: content_id },{
				$set: {
					hide: 'false',
				}
			});
			return reply.send({
				message: `Контент [${content_id}] виден`,
				refresh: 'true',
			});
		}
	}
	catch(err){
		console.log('Ошибка скрытия контента: ', err);
		return reply.send({error: 'Ошибка скрытия контента: ', err});
	}
});	

fastify.post('/set_my_last_page', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден! ', err);
		return reply.status(401).send({error: 'Пользователь не найден! ', err});
	};
	const group_id = request?.body?.group_id;
	if( !group_id ){
		console.log('Проблема с group_id');
		return reply.send({error: 'Проблема с group_id'})
	};
	const group_password = request?.body?.group_password;
	const group =  await Group_Schema.findOne({_id: group_id});
	if( !group ){
		console.log('Группа не найдена');
		return reply.send({error: 'Группа не найдена'});
	} 
	const current_password = JSON.parse(group?.group_settings)?.password;
	if( !current_password ){
		console.log('Ошибка: Существующий пароль не найден');
		return reply.send({error: 'Ошибка: Существующий пароль не найден'});
	};
	const compare_passwords = await bcrypt.compare(group_password, current_password);
	if( !compare_passwords ){
		console.log('Пароли не совпадают [0]');
		return reply.send({error: 'Пароли не совпадают'});
	}
	try{
		await User_Schema.updateOne(
			{_id: my_id},
			{$set: {last_page: {
				last_page: group_id,
				group_password: current_password || '',
			} }}
		);
		return reply.send({
			message: 'Установлен последний путь',
			last_page: {
				last_page: group_id,
				group_password: current_password,
			}
		})
	}
	catch(err){
		console.log('Ошибка /set_my_last_page : ', err);
		return reply.send({error: 'Ошибка установки последнего местоположения: ', err});
	}
});

fastify.post('/get_my_last_page', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const group_id = request?.body?.group_id;
	if( !group_id ){
		console.log('Проблема с group_id');
		return reply.send({error: 'Проблема с group_id'})
	};
	const group_data = await Group_Schema.findOne({_id: group_id})
	if( !group_data ){
		console.log('Ошибка: Данные группы не получены:');
		return reply.send({error: 'Ошибка получения данных группы:'});
	};
	const exist_password = JSON.parse(group_data?.group_settings);
	const last_page = my_user?.last_page;
	try{
		console.log('my_user = ', my_user);
		return reply.send({
			message: 'последняя открытая страница',
			last_page: {
				last_page: last_page?.last_page,
				group_password: exist_password?.password,
				passwords_compared: exist_password?.password === '' ? true : last_page?.group_password === exist_password?.password ? true : false,
			}, //last_page + group_password
		})
	}
	catch(err){
		console.log('Ошибка /get_my_last_page : ', err);
		return reply.send({error: 'Ошибка: ', err});
	}
});

fastify.post('/check_my_id', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const curr_user = JSON.parse(request.body?.curr_user);
	if( !curr_user ){
		// console.clear()
		return reply.status(401).send({error: 'Отказано!', err});
	}

	try{
		// console.clear()
		console.log('request.body = ', request.body)
		console.log('curr_user.to = ', curr_user.to);
		console.log('curr_user.from = ', curr_user.from);
		if( curr_user.to === my_id || curr_user.from === my_id ){
			// console.clear()
			console.log('++++++++++++++++++++++++++++++++++++')
			return reply.send({
				message: 'Всё ок'
			})
		}
	}
	catch(err){
		console.log('Ошибка: ', err);
		return reply.send({error: 'Ошибка: ', err});
	}
});


fastify.post('/get_members', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const group_id = request.body?.group_id;
	if( !group_id ){
		console.log('Ошибка: id группы не передан');
		return reply.status(401).send({error: 'Ошибка: id группы не передан'});
	};
	try{
		const current_group = await Group_Schema.findOne({_id: group_id});
		if( !current_group ){
			console.log('Указаной группы нет');
			return reply.send({error: 'Указаной группы нет'});
		};
		const members = current_group?.group_members;
		if( members && members.length > 0 ){
			const in_group = members.some(member=>member.id === my_id)
			if( in_group ){
				return reply.send({
					message: 'Вы в составе группы',
					join: true,
					refresh: true,
					members: members,
				})
			}
			else{
				return reply.send({
					message: 'Вас нет в составе группы',
					join: false,
					return: true,
					members: members,
				})
			}
		}
	}
	catch(err){
		console.log('Ошибка: ', err);
		return reply.send({error: 'Ошибка: ', err});
	}
});

fastify.post('/join_group', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const group_id = request.body?.group_id;
	if( !group_id ){
		console.log('Ошибка: id группы не передан');
		return reply.status(401).send({error: 'Ошибка: id группы не передан'});
	};
	try{
		const current_group = await Group_Schema.findOne({_id: group_id});
		if( !current_group ){
			console.log('Такой группы нет');
			return reply.send({error: 'Такой группы нет'})
		};
		console.log('current_group = ', current_group)
		if( current_group?.group_members.length > 0 ){
			const in_group = current_group?.group_members?.some(member => member.id === my_id);
			current_group?.group_members.forEach((member)=>{
				console.log('member = ', member);
				console.log('my_id = ', my_id)
				console.log('')
			})
			if( in_group ){
				console.log('Уже с списке пользователей группы');
				return reply.send({
					message: 'Уже в списках пользователей группы',
					last_page: {
						last_page: my_user?.last_page?.last_page,
						group_password: my_user?.last_page?.group_password,
					},
					join: true,
					refresh: true,
				});
			}
			else {
				//вход
				try{
					await Group_Schema.updateOne({_id: group_id},
						{$addToSet: {
							group_members: {
								id: my_id,
								profil_avatar: my_user?.profil_avatar,
								role: my_user?.role,
								username: my_user?.name,
							}
						}});
					console.log(`Пользователь ${my_id} вошёл в группу ${group_id}`);
					return reply.send({
						message: 'Вы вошли в группу',
						refresh: true,
						last_page: {
							last_page: my_user?.last_page?.last_page,
							group_password: my_user?.last_page?.group_password,
						},
						join: true,
					});
				}
				catch(err){
					console.log('Ошибка: ', err);
					return reply.send({error: 'Ошибка: ', err});
				}
			}
		}
		else {
			//вход
			try{
				await Group_Schema.updateOne({_id: group_id},
					{$addToSet: {
						group_members: {
							id: my_id,
							profil_avatar: my_user?.profil_avatar,
							role: my_user?.role,
							username: my_user?.name,
						}
					}});
				console.log(`Пользователь ${my_id} вошёл в группу ${group_id}`);
				return reply.send({
					message: 'Вы вошли в группу',
					refresh: true,
					join: true,
				});
			}
			catch(err){
				console.log('Ошибка: ', err);
				return reply.send({error: 'Ошибка: ', err});
			}
		}
	}
	catch(err){
		console.log('Ошибка: ', err);
		return reply.send({error: 'Ошибка: ', err});
	}
});

fastify.post('/leave_group', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const group_id = request.body?.group_id;
	if( !group_id ){
		console.log('Ошибка: id группы не передан');
		return reply.status(401).send({error: 'Ошибка: id группы не передан'});
	};
	try{
		const current_group = await Group_Schema.findOne({_id: group_id});
		if( !current_group ){
			console.log('Такой группы нет');
			return reply.send({error: 'Такой группы нет'})
		};
		if( current_group?.group_members.length > 0 ){
			const in_group = current_group?.group_members.some(member => member.id === my_id);
			if( in_group ){
				//выход...
				await Group_Schema.updateOne({_id: group_id},
					{$pull: {
						group_members: {
							id: my_id,
						}
					}});
				console.log(`Пользователь ${my_id} вышел из группы ${group_id}`);
				return reply.send({
					message: `Пользователь ${my_id} вышел из группы ${group_id}`,
					refresh: true,
					leave: true,
				})
			}
			else{
				console.log(`Вас нет в списках пользователей группы`);
				return reply.send({
					message: `Вас нет в списках группы`,
					leave: true,
					refresh: true,
				});
			}
		}
		else {
			console.log('В группе нет пользователей')
		}
	}
	catch(err){
		console.log('Ошибка: ', err);
		return reply.send({error: 'Ошибка: ', err});
	}
});

fastify.post('/set_bad_request_for_group', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const group_id = request.body?.group_id;
	if( !group_id ){
		console.log('id группы не передан');
		return reply.status(401).send({error: 'id группы не передан'});
	};
	const group = await Group_Schema.findOne({_id: group_id});
	if( !group ){
		console.log(`Ошибка: группа с id [${group_id}] не существует`);
		return reply.send({error: `Ошибка: группа с id [${group_id}] не существует`});
	};
	try{
		if( !group?.group_bad_requests ){
			console.log('Группа не имеет bad_requests. Создание...');
			await Group_Schema.updateOne({_id: group_id},{
				$set: {
					group_bad_requests: []
				}
			});
			console.log('Создание bad_requests завершено!');
		}
		console.log('bad_requests = ', group?.group_bad_requests);
		const bad_requests = group?.group_bad_requests;
		const exist_user = bad_requests.find(request => request?.user_id === my_id && request?.group_id === group_id);
		if( exist_user ){
			console.log('Вы уже оставили жалобу');
			return reply.send({message: 'Вы уже оставили жалобу'});
		};
		await Group_Schema.updateOne({_id: group_id},{
			$push: {
				group_bad_requests: {
					user_id: my_id,
					group_id: group_id,
				}
			}
		});
		console.log('Жалоба успешно отправлена!');
		return reply.send({message: 'Жалоба успешно отправлена!'});
	}
	catch(err){
		console.log('Ошибка: не удалось пожаловаться', err);
		return reply.send({error: 'Ошибка: не удалось пожаловаться',err});
	};
});

fastify.post('/remove_bad_request_for_group', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const group_id = request.body?.group_id;
	if( !group_id ){
		console.log('id группы не передан');
		return reply.status(401).send({error: 'id группы не передан'});
	};
	const group = await Group_Schema.findOne({_id: group_id});
	if( !group ){
		console.log(`Ошибка: группа с id [${group_id}] не существует`);
		return reply.send({error: `Ошибка: группа с id [${group_id}] не существует`});
	};
	try{
		if( !group?.group_bad_requests ){
			console.log('Группа не имеет bad_requests. Создание...');
			await Group_Schema.updateOne({_id: group_id},{
				$set: {
					group_bad_requests: []
				}
			});
			console.log('Создание bad_requests завершено!');
		}
		console.log('bad_requests = ', group?.group_bad_requests);
		const bad_requests = group?.group_bad_requests;
		const exist_user = bad_requests.find(request => request?.user_id === my_id && request?.group_id === group_id);
		if( !exist_user ){
			console.log('Вы ешё не оставили жалобу. Критическая ошибка!');
			return reply.send({message: 'Вы ещё не оставили жалобу. Критическая ошибка!'});
		}
		await Group_Schema.updateOne({_id: group_id},{
			$pull: {
				group_bad_requests: {
					user_id: my_id,
					group_id: group_id,
				}
			}
		});
		console.log('Жалоба успешно отменена!');
		return reply.send({message: 'Жалоба успешно отменена!'});
	}
	catch(err){
		console.log('Ошибка: не удалось отменить жалобу', err);
		return reply.send({error: 'Ошибка: не удалось отменить жалобу',err});
	};
});

fastify.post('/set_user_page_data', async (request, reply) => {    // ЧТО ЭТО???
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const user_id = request.body?.user_id;
	if( !user_id ){
		console.log('Не передан id страницы:', err);
		return reply.status(401).send({error: 'Не передан id страницы: ', err});
	};
	try{
		console.log('/set_user_page_data');
	}
	catch(err){
		console.log('Ошибка: ', err);
		return reply.send({error: 'Ошибка: ', err});
	}
});

fastify.post('/get_user_page_data', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const user_id = request.body?.user_id;
	if( !user_id ){
		console.log('Не передан id страницы:', err);
		return reply.status(401).send({error: 'Не передан id страницы: ', err});
	};
	try{
		const user = await User_Schema.findOne({_id: user_id});
		if( user ){
			console.log('Данные получены');
			const user_data = {
				id: user._id,
				name: user.name,
				email: user.email,
				last_activity: user.last_activity,
				avatar: user.profil_avatar,
				t_number: user.t_number,
				online: user?.online,
			}
			return reply.send({
				message: 'Данные получены',
				user_data: user_data,
				page_data: user?.page_data,
				refresh: true,
				my_page: my_id === user_id ? true : false,
			});
		}
	}
	catch(err){
		console.log('Ошибка получения данных: ',err);
		return reply.send({error: 'Ошибка получения данных: ', err});
	}
});

fastify.post('/get_user_page_content_data', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const user_id = request.body?.user_id;
	if( !user_id ){
		console.log('Не передан id страницы:', err);
		return reply.status(401).send({error: 'Не передан id страницы: ', err});
	};
	try{
		// поиск страниц с id = my_id
		const current_page = await User_Page_Schema.findOne({page_id: user_id});
		if( !current_page ){
			console.log('Такая страница не существует');
			return reply.send({error: 'Такая страница не существует'});
		};
		if( current_page?.creator_id === my_id ){
			return reply.send({
				my_page: true,
				content: current_page,
			});
		}
		else{
			return reply.send({
				my_page: false,
				content: current_page,
			})
		};
	}
	catch(err){
		console.log('Ошибка получения контента: ', err);
		return reply.send({error: 'Ошибка получения контента: ', err});
	}
});

fastify.get('/check_online', async (request, reply) => {
	console.log('/check_online')
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const other_user_id = request?.query?.user_id || undefined;
	try{
		const my_user = await User_Schema.findOne({_id: my_id});
		if( !my_user ){
			console.log('Пользователь не найден!');
			return reply.status(401).send({error: 'Пользователь не найден!'});
		};
		const other_user = await User_Schema.findOne({_id: other_user_id});
		console.log('my_online = ', my_user?.online)
		console.log('other_online = ', other_user?.online)
		return reply.send({
			my_online: my_user?.online,
			other_online: other_user?.online,
		})
	}
	catch(err){
		return reply.send({error: 'Ошибка поиска other_user'})
	}
	return;
});

fastify.post('/change_status_online', async (request, reply) => {
	console.log('/change_status_online')
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const status = request?.body?.status || undefined;
	if( !status ){
		console.log('Ошибка: Не передан статус запроса');
		return reply.send({error: 'Не передан статус запроса'});
	};
	try{
		///
		const user = await User_Schema.findOne({_id: my_id});
		if(!user){
			throw 'Пользователя нет';
		};
		console.log('Пользователь в сети? ', user?.online)
		if( status === 'y' ){
			await User_Schema.updateOne({_id: my_id},{$set: {online: true}})
		};
		if( status === 'n' ){
			await User_Schema.updateOne({_id: my_id},{$set: {online: false}})
		}; 
		const updated_user = await User_Schema.findOne({_id: my_id});
		console.log('[updated_user] status = ', updated_user?.status)
		///
	}
	catch(err){
		console.log('Ошибка: ',err);
		return reply.send({error: 'Ошибка: ', err});
	}
});

fastify.post('/send_invite_in_group', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const for_user = request.body?.for_user;
	if( !for_user ){
		console.log('Ошибка: Не передан id получателя');
		return reply.send({error: 'Ошибка: Не передан id получателя'});
	};
	const current_user = await User_Schema.findOne({_id: for_user});
	if( !current_user ){
		console.log('Пользователя с id ',for_user, ' не найдено');
		return reply.send({error: `Пользователя с id [${for_user}] не найдено`});
	};
	const invite = request.body?.invite_data;
	if( !invite ){
		console.log('Данные приглашения не переданы');
		return reply.send({error: 'Данные приглашения не переданы'});
	};
	const from_user_id = request.body?.from_user_id;
	if( !from_user_id ){
		console.log('Не передан id отправителя');
		return reply.send({error: 'Не передан id отправителя'});
	};
	try{
		const group_id = invite?.id;
		if( group_id ){
			const group = await Group_Schema.findOne({_id: group_id});
			if( group ){
				const group_name = group?.group_name;
				const group_img = group?.group_img;
				if( group_name && group_img ){
					const new_invite = {
						avatar_for: current_user?.profil_avatar,
						avatar_from: my_user?.profil_avatar,
						avatar_group: group?.group_img,
						id: group_id,
						name_from: my_user?.name,
						group_name: group_name,
						group_img: group_img,
					};
					if( new_invite ){
						console.log('new_invite = ', new_invite);
						try {
							const New_Invite = new Invites_Schema({
								id_from: from_user_id,
								id_for: for_user,
								invite_data: new_invite,
							});
							if( New_Invite ){
								await New_Invite.save();
								console.log('Приглашение отправлено!');

								await User_Schema.updateOne({_id: my_id},{
									$set: {
										waiting_join_in_group: from_user_id,
									}
								}) 
								return reply.send({
									message: 'Приглашение отправлено!',
									refresh: true,
								})
							}
						}
						catch(err){
							console.log('Ошибка: ', err);
							return reply.send({error: 'Ошибка: ', err});
						}
					}
					else{
						console.log('new_invite пустой / error');
					};
				};
			};
		}
	}
	catch(err){
		console.log('Ошибка: ', err);
		return reply.send({error: 'Ошибка: ', err});
	}
});

fastify.post('/add_invite_id_for_user', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const group_id = request.body?.group_id;
	if( !group_id ){
		console.log('id группы не передано [5267]');
		return reply.status(401).send({error: 'id группы не передано [5267]'});
	};
	const from_user = request?.body?.id_from;
	const for_user = request?.body?.id_for;
	// console.log('_____________ 5237: from_user = ', from_user);
	// console.log('_____________ 5276: for_user = ', for_user);
	if( !for_user ){
		console.log('id отправителя приглашения не передано');
		return reply.status(401).send({error: 'id отправителя приглашения не передано'});
	};
	try{
		//добавление в waiting_join_in_group id пригласителя
		await User_Schema.updateOne({_id: my_id}, {
			$set: {
				waiting_join_in_group: for_user,
			}
		});
		console.log('id приглашения добавлено!');
		return reply.send({message: 'id приглашения добавлено'});
	}
	catch(err){
		console.log('Ошибка: ', err);
		return reply.send({error: 'Ошибка: ', err});
	}
});

fastify.post('/get_invite_id_for_user', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const group_id = request.body?.group_id;
	if( !group_id ){
		console.log('id группы не передано');
		return reply.status(401).send({error: 'id группы не передано [5319]'});
	};
	try{
		const invite = my_user?.waiting_join_in_group;
		if( invite ){
			console.log('приглашение получено!');
			return reply.send({
				message: 'приглашение получено!',
				refresh: true,
				invite_user_id: invite,
			})
		}
		else{
			console.log('my_user = ', my_user)
			return reply.send({message: 'Что-то не так'});
		}
	}
	catch(err){
		console.log('Ошибка получения приглашения: ', err);
		return reply.send({error: 'Ошибка получения приглашения: ', err});
	}
});

fastify.post('/remove_all_invites', async (request, reply) => {
	try{
		await Invites_Schema.deleteMany();
		console.log('Уведомления удалены');
	}
	catch(err){
		console.log('Ошибка удаления: ', err);
	}
})

fastify.post('/get_invites', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const current_user = await User_Schema.findOne({_id: my_id});
	if( !current_user ){
		console.log('Пользователя с id ',user_id, ' не найдено');
		return reply.send({error: `Пользователя с id [${my_id}] не найдено`});
	};
	const group_id = request.body?.group_id;
	if( group_id ){
		try{
			const sended_invites = await Invites_Schema.find({id_from: my_id});
			if( sended_invites.length > 0 ){
				sended_invites.forEach(async invite => {
					console.log('invite = ', invite)
					reply.send({
						sended_invites: sended_invites,
					})
				})
			}
		}
		catch(err){
			console.log('Ошибка: ', err);
		}
	};
	try{
		console.log('Поиск приглашений...')
		const all_invites = await Invites_Schema.find();
		if( all_invites.length > 0 ){
			console.log('Все существующие приглашения: all_invites = ', all_invites)
			console.log('my_id = ', my_id)
		}
		const invites = await Invites_Schema.find({id_from: my_id});
		if( !invites ){
			console.log('[5401] _____ invites = пусто или ошибка')
			return reply.send({
				error: 'invites пусто или ошибка',
				invites: [],
				return: true,
			});
		};
		if( invites.length > 0 ){
			console.log('[5409] _____ invites = ', invites)
			return reply.send({
				invites: invites,
				return: true,
			});
		}
		else {
			console.log('[5416] _____ invites = []')
			return reply.send({
				invites: [],
				return: true,
			});
		}
	}
	catch(err){
		console.log('Ошибка: ', err);
		return reply.send({error: 'Ошибка: ',err});
	}
});

fastify.post('/get_invites_for_me', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const current_user = await User_Schema.findOne({_id: my_id});
	if( !current_user ){
		console.log('Пользователя с id ',user_id, ' не найдено');
		return reply.send({error: `Пользователя с id [${my_id}] не найдено`});
	};
	try{
		const invites = await Invites_Schema.find({id_for: my_id});
		if( invites.length > 0 ){
			console.log('Приглашения получены');
			return reply.send({
				message: 'Приглашения получены',
				invites: invites,
				refresh: true,
			})
		}
	}
	catch(err){
		console.log('Ошибка получения приглашений: ', err);
		return reply.send({error: 'Ошибка получения приглашений: ', err});
	}
})

fastify.post('/accept_invite', async (request, reply) => {
	// принять запрос
});

fastify.post('/cancel_invite', async (request, reply) => {
	// отклонить запрос
});

fastify.post('/remove_invite', async (request, reply) => {
	// очистить запрос
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const invite = JSON.parse(request.body?.invite);
	if( !invite ){
		console.log('Не переданы данные');
		return reply.send({error: 'Не переданы данные'});
	};
	try{
		console.log('invite = ', invite);
		await Invites_Schema.deleteOne({_id: invite?._id});
		console.log('Приглашение удалено / отменено');
		return reply.send({
			message: 'Приглашение удалено / отменено',
			refresh: true,
		})
	}
	catch(err){
		console.log('Ошибка: ', err);
		return reply.send({error: 'Ошибка: ', err});
	}
});

fastify.post('/set_password_for_group', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const group_id = request?.body?.group_id;
	if( !group_id ){
		console.log('id группы не передан');
		return reply.send({error: 'id группы не передан'});
	}
	const group = await Group_Schema.findOne({_id: group_id});
	if( !group ){
		console.log('Группа с таким id не найдена');
		return reply.send({error: 'Группа с таким id не найдена'});
	}
	const password = request?.body?.password;
	if( !password || password.trim('').length === 0 || password.trim('') === '' ){
		console.log('Пароль не передан на установку')
	}
	const settings = JSON.parse(group?.group_settings);
	const hashed_password = await bcrypt.hash(password, 10);
	if( !hashed_password ){
		console.log('Ошибка создания пароля [h]');
		return reply.send({error: 'Ошибка создания пароля [h]'});
	}
	const new_settings = JSON.stringify({...settings, password: hashed_password});
	if( !new_settings ){
		console.log('Ошибка создания пароля: [n]');
		return reply.send({error: 'Ошика создания пароля [n]'});
	}
	try{
		await Group_Schema.updateOne({_id: group_id},{
			$set: {
				group_settings: new_settings,
			}
		})
		return reply.send({
			message: 'Пароль установлен',
			refresh: true,
		})
	}
	catch(err){
		console.log('Ошибка установки пароля для группы: ', err);
		return reply.send({error: 'Ошибка установки пароля для группы: ', err});
	}
})

fastify.post('/change_password_for_group', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const group_id = request?.body?.group_id;
	if( !group_id ){
		console.log('id группы не передан');
		return reply.send({error: 'id группы не передан'});
	}
	const this_my_group = request?.body?.this_my_group;
	const group = await Group_Schema.findOne({_id: group_id});
	if( !group ){
		console.log('Группа с таким id не найдена');
		return reply.send({error: 'Группа с таким id не найдена'});
	}
	const new_password = request?.body?.new_password;
	if( !new_password || new_password.trim('').length === 0 || new_password.trim('') === '' ){
		console.log('Новый пароль не передан на установку')
	}
	if( !this_my_group ){
		const old_password = request?.body?.old_password;
		if( !old_password || old_password.trim('').length === 0 || old_password.trim('') === '' ){
			console.log('Старый пароль не передан на проверку')
		}
		const current_password = JSON.parse(group?.group_settings).password;
		const compare_passwords = await bcrypt.compare(old_password, current_password);
		if( !compare_passwords ){
			console.log('Старый пароль не верный');
			return reply.send({error: 'Старый пароль не верный'});
		}
		console.log('current_password = ', current_password);
		console.log('old_password = ', old_password);
		const new_hashed_password = await bcrypt.hash(new_password, 10);
		if( !new_hashed_password ){
			console.log('Ошибка создания нового пароля');
			return reply.send({error: 'Ошибка создания нового пароля'});
		}
		const old_settings = JSON.parse(group?.group_settings);
		const new_settings = JSON.stringify({...old_settings, password: new_hashed_password});
		if( !new_settings ){
			console.log('Ошибка изменения настроей группы');
			return reply.send({error: 'Ошибка изменения настроек группы'});
		}
		try{
			await Group_Schema.updateOne({_id: group_id},{
				$set: {
					group_settings: new_settings,
				}
			})
			console.log('Пароль успешно изменён!');
			return reply.send({
				message: 'Пароль успешно изменён!',
				refresh: true,
			});
		}
		catch(err){
			console.log('Ошибка установки пароля для группы: ', err);
			return reply.send({error: 'Ошибка установки пароля для группы: ', err});
		}
	}
	else {
		const new_hashed_password = await bcrypt.hash(new_password, 10);
		if( !new_hashed_password ){
			console.log('Ошибка создания нового пароля');
			return reply.send({error: 'Ошибка создания нового пароля'});
		}
		const old_settings = JSON.parse(group?.group_settings);
		const new_settings = JSON.stringify({...old_settings, password: new_hashed_password});
		if( !new_settings ){
			console.log('Ошибка изменения настроей группы');
			return reply.send({error: 'Ошибка изменения настроек группы'});
		}
		try{
			await Group_Schema.updateOne({_id: group_id},{
				$set: {
					group_settings: new_settings,
				}
			})
			console.log('Пароль успешно изменён!');
			return reply.send({
				message: 'Пароль успешно изменён!',
				refresh: true,
			});
		}
		catch(err){
			console.log('Ошибка установки пароля для группы: ', err);
			return reply.send({error: 'Ошибка установки пароля для группы: ', err});
		}
	}
});

fastify.post('/remove_password_for_group', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const group_id = request?.body?.group_id;
	if( !group_id ){
		console.log('id группы не передан');
		return reply.send({error: 'id группы не передан'});
	}
	const this_my_group = request?.body?.this_my_group;
	const group = await Group_Schema.findOne({_id: group_id});
	if( !group ){
		console.log('Группа с таким id не найдена');
		return reply.send({error: 'Группа с таким id не найдена'});
	}
	if( this_my_group){
		const old_settings = JSON.parse(group?.group_settings);
		const new_settings = JSON.stringify({...old_settings, password: ''});
		if( !new_settings ){
			console.log('Ошибка изменения настроей группы');
			return reply.send({error: 'Ошибка изменения настроек группы'});
		}
		try{
			await Group_Schema.updateOne({_id: group_id},{
				$set: {
					group_settings: new_settings,
				}
			})
			console.log('Пароль успешно удалён!');
			return reply.send({
				message: 'Пароль успешно удалён!',
				refresh: true,
			});
		}
		catch(err){
			console.log('Ошибка установки пароля для группы: ', err);
			return reply.send({error: 'Ошибка установки пароля для группы: ', err});
		}
	}
});

fastify.post('/clear_members', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const group_id = request?.body?.group_id;
	if( !group_id ){
		console.log('id группы не передан');
		return reply.send({error: 'id группы не передан'});
	}
	try{
		await Group_Schema.updateOne({_id: group_id},{
			$set: {
				group_members: []
			}
		});
		console.log('Очистка пользователей группы успешна!');
		return reply.send({message: 'Очистка пользоветелей группы успешна!'});
	}
	catch(err){
		console.log('Ошибка: ', err);
		return reply.send({error: 'Ошибка: ', err});
	}
});

fastify.post('/add_favourites', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const content = request?.body?.content;
	if( !content ){
		console.log('Контерт не передан на добавление в избранное');
		return reply.send({message: 'Контерт не передан на добавление в избранное'})
	}
	console.log('content = ', content);
	try{
		if( content?.type === 'user_page' ){
			// избранная страница пользователя
			const favourites = await Favourites_Schema.find();
			const exist_favourite = favourites?.some(favourite => (favourite?.content_id === content?.id && favourite?.content_my_id === my_id));
			if( exist_favourite ){
				console.log('Контент уже добавлен в избранное');
				console.log('favourites = ', favourites);
				return reply.send({message: 'Контент уже добавлен в избранное'});
			};
			const user = await User_Schema.findOne({_id: content?.id});
			if( !user ){
				console.log('Такого пользователя нет')
				return reply.send({error: 'Такого пользователя нет'});
			};
			const new_favourite = new Favourites_Schema({
				type: content?.type,
				content_id: content?.id,
				content_my_id: content?.my_id,
				my_id: my_id,
				content_user_name: user?.name || null,
				content_data: content?.data || null,
			});
			if( !new_favourite ){
				console.log('Ошибка создания избранного контента');
				return reply.send({error: 'Ошибка создания избранного контента'});
			};
			console.log('new_favourite = ', new_favourite);
			console.log('Сохранение избранного');
			await new_favourite.save();
			console.log('Успешно!');
		};
		if( content?.type === 'mail' ){
			// избранное сообщение
			// console.log('content = ', content);
			const favourites = await Favourites_Schema.find();
			const exist_favourite = favourites?.some(favourite => (favourite?.content_id === content?.id && favourite?.content_my_id === my_id));
			if( exist_favourite ){
				console.log('Контент уже добавлен в избранное');
				console.log('favourites = ', favourites);
				return reply.send({message: 'Контент уже добавлен в избранное'});
			};
			const mail = await Message_Schema.findOne({_id: content?.id});
			if( !mail ){
				console.log('Такого сообщения нет')
				return reply.send({error: 'Такого сообщения нет'});
			};
			const new_favourite = new Favourites_Schema({
				type: content?.type,
				content_id: content?.id,
				content_my_id: content?.my_id,
				my_id: my_id,
				content_user_name: (my_id === mail?.from ? mail?.name_sender : my_id === mail?.from ? mail?.name_to_send : mail?.name_sender) || null,
				content_data: content?.data || null,
			});
			console.log(new_favourite);
			if( !new_favourite ){
				console.log('Ошибка создания избранного контента');
				return reply.send({error: 'Ошибка создания избранного контента'});
			};
			console.log('Сохранение избранного');
			await new_favourite.save();
			console.log('Успешно!');
		};
		if( content?.type === 'group' ){
			// избранная группа
			console.log('content = ', content);
			const favourites = await Favourites_Schema.find();
			const exist_favourite = favourites?.some(favourite => (favourite?.content_id === content?.id && favourite?.content_my_id === my_id));
			if( exist_favourite ){
				console.log('Контент уже добавлен в избранное');
				console.log('favourites = ', favourites);
				return reply.send({message: 'Контент уже добавлен в избранное'});
			};
			const group = await Group_Schema.findOne({_id: content?.id});
			if( !group ){
				console.log('Такой группы нет')
				return reply.send({error: 'Такой группы нет'});
			};
			const new_favourite = new Favourites_Schema({
				type: content?.type,
				content_id: content?.id,
				content_my_id: content?.my_id,
				my_id: my_id,
				content_group_name: content?.content_data?.name || null,
				content_data: content?.data || null,
			});
			console.log(new_favourite);
			if( !new_favourite ){
				console.log('Ошибка создания избранного контента');
				return reply.send({error: 'Ошибка создания избранного контента'});
			};
			console.log('Сохранение избранного');
			await new_favourite.save();
			console.log('Успешно!');
		};
		if( content?.type === 'group_content' ){
			// избранная группа
			console.log('content = ', content);
			const favourites = await Favourites_Schema.find();
			const exist_favourite = favourites?.some(favourite => (favourite?.content_id === content?.id && favourite?.content_my_id === my_id));
			if( exist_favourite ){
				console.log('Контент уже добавлен в избранное');
				console.log('favourites = ', favourites);
				return reply.send({message: 'Контент уже добавлен в избранное'});
			};
			const gr_content = await Post_Group_Schema.findOne({_id: content?.id});
			if( !gr_content ){
				console.log('Такого контента нет')
				return reply.send({error: 'Такого контента нет'});
			};
			const new_favourite = new Favourites_Schema({
				type: content?.type,
				content_id: content?.id,
				content_my_id: content?.my_id,
				my_id: my_id,
				content_data: content?.data || null,
			});
			console.log(new_favourite);
			if( !new_favourite ){
				console.log('Ошибка создания избранного контента');
				return reply.send({error: 'Ошибка создания избранного контента'});
			};
			console.log('Сохранение избранного');
			await new_favourite.save();
			console.log('Успешно!');
		};
		if( content?.type === 'image' ){
			// избранная группа
			console.log('content = ', content);
			const favourites = await Favourites_Schema.find();
			const exist_favourite = favourites?.some(favourite => (favourite?.content_id === content?.id && favourite?.content_my_id === my_id));
			if( exist_favourite ){
				console.log('Контент уже добавлен в избранное');
				console.log('favourites = ', favourites);
				return reply.send({message: 'Контент уже добавлен в избранное'});
			};
			const new_favourite = new Favourites_Schema({
				type: content?.type,
				content_id: content?.id,
				content_my_id: content?.my_id,
				my_id: my_id,
				content_data: content?.data || null,
			});
			console.log(new_favourite);
			if( !new_favourite ){
				console.log('Ошибка создания избранного контента');
				return reply.send({error: 'Ошибка создания избранного контента'});
			};
			console.log('Сохранение избранного');
			await new_favourite.save();
			console.log('Успешно!');
		};
	}
	catch(err){
		console.log('Ошибка добавления в избранное: ', err);
		return reply.send({error: 'Ошибка добаления в избранное ', err});
	}
});

fastify.post('/get_favourites', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	try{
		const favourites = await Favourites_Schema.find({my_id: my_id});
		if( favourites.length > 0 ){
			console.log('Избранный контент найден!');
			return reply.send({
				message: 'Избранный контент найден',
				refresh: true,
				favourites: favourites,
			})
		}
		else{
			console.log('Избранного контенте нет');
			return reply.send({
				message: 'Избранного контента нет',
				refresh: true,
				favourites: [],
			})
		}
	}
	catch(err){
		console.log('Не удалось получить избранный контент. Ошибка: ', err);
		return reply.send({error: 'Не удалось получить избранный контент: Ошибка: ', err});
	}
});

fastify.post('/clear_favourites', async (request, reply) => {
	await Favourites_Schema.deleteMany();
});

fastify.post('/clear_favourite', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const content = request?.body?.favourite;
	if( !content ){
		console.log('избранный контент не передан на удаление');
		return reply.status(401).send({error: 'Избранный контент не передан на удаление'});
	}
	const content_id = content?.content_id;
	console.log('content_id = ', content_id);
	try{
		await Favourites_Schema.deleteOne({content_id: content_id});
		console.log('Контент удалён!');
		return reply.send({
			message: 'Контент удалён!',
			refresh: true,
		});
	}
	catch(err){
		console.log('Ошибка удаления избранного контента: ', err);
		return reply.send({error: 'Ошибка удаления избранного контента: ', err});
	}
});

fastify.post('/send_voice_message', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
  	try{
	  	//установка пути к папке с аудио
	  	const folder_path = '../../src/audio_files/';
	  	const folder = path.join(__dirname, folder_path);
	  	const path_access = await fs.access(folder).then((e)=>true).catch((err)=>false);

	  	if( !path_access ){

	  		console.log('Папка с аудио не существует.');
	  		console.log('Создание папки...');
	  		try{

	  			await fs.mkdir(path);
	  			console.log('Папка для аудио создана!');
	  			console.log('Путь к папке: ', path);
	  		}
	  		catch(err){
	  			return console.log('Ошибка создания папки: ', err);
	  		};
	  	};

	  	const audio = request.body?.audio;
	  	if( !audio ){
	  		console.log('Головое сообщение не передано на сервер!');
	  	};
	  	// console.log('audio = ', audio);
	  	const audio_name = audio?.filename;
	  	const audio_mime = audio?.mimetype;
	  	const audio_size = audio?.file?.bytesRead;
	  	if( !audio_name || !audio_mime || !audio_size ){
	  		console.log('Ошибка данных аудио');
	  	};
	  	console.log('audio_name = ', audio_name || 'Ошибка');
	  	console.log('audio_mime = ', audio_mime || 'Ошибка');
	  	console.log('audio_size = ', `${Math.floor(audio_size / 1024)}` + `${(Math.floor(audio_size / 1024) < 1023) && (Math.floor(audio_size) < 1024) ? 'Б' : 'Кб'}` || 'Ошибка');
	  	console.log('');
	  	console.log('Путь к папке с аудио: ', folder);

	  	//сохранение
	  	try{
	  		const new_audio_name = `${Date.now()}_audio_${audio_name}.${audio_mime === 'audio/webm' && 'webm'}`;
	  		const new_audio_path = path.join(folder, new_audio_name);
	  		console.log('Новое имя аудио: ', new_audio_name);
	  		await fs.writeFile(new_audio_path, await audio.toBuffer());
	  		console.log('Аудио добавлено в папку: ', new_audio_path);

	  		console.log('Возвращаем название аудио для проверки (тест)')
	  		return reply.send({
	  			message: 'Аудио загружено на сервер',
	  			audio: {
	  				name: new_audio_name,
	  				path: new_audio_path,
	  				raw_size: audio_size,
	  				size: `${Math.floor(audio_size / 1024)}` + `${(Math.floor(audio_size / 1024) < 1023) && (Math.floor(audio_size) < 1024) ? 'Б' : 'Кб'}` || 'Ошибка',
	  			},
	  		})
	  	}
	  	catch(err){
	  		console.log('Ошибка сохранения аудио: ', err);
	  	}
    }
  	catch(err){
  		console.log('Ошибка приёма голосового сообщения: ', err);
 	}
});

fastify.post('/send/verify_code', async (request, reply) => {
	const send_to = request?.body?.send_to;
	if( !send_to ){
		return reply.send({error: 'Ошибка отправки проверочного кода: Не указан получатель!'});
	};
	// проверка на существование пользователя...
	try{
		const user = await User_Schema.find({email: send_to});
		const all_users = await User_Schema.find();
		if( user.length > 0 ){
			console.log(`Пользователь ${send_to} уже зарегистрирован!`)
			console.log('Существующие пользователи: ', all_users);
			return reply.send({
				message: 'Пользователь уже зарегистрирован!'
			});
		}
	}
	catch(err){
		console.log('Ошибка проверки: ', err);
		return reply.send({error: 'Ошибка проверки: ', err});
	}
	try{
		// создание транспортёра...
		const transporter = nodemailer.createTransport({
			host: process.env.JWT_NODEMAILER_HOST,
			port: Number(process.env.JWT_NODEMAILER_POST),
			secure: process.env.JWT_NODEMAILER_SECURE,
			auth: {
				user: process.env.JWT_NODEMAILER_USER,
				pass: process.env.JWT_NODEMAILER_PASSWORD,
			}
		});
		if( !transporter ){
			console.log('Ошибка: transporter');
		};
		// создание рандомного кода...
		const code = Math.floor(Math.random()*100000).toString().slice(0,4).padStart(4,'0');
		// шифрование кода...
		const hashed_code = await bcrypt.hash(code, 5);
		if( !hashed_code ){
			console.log('Ошибка шифровки кода');
		};
		// проверка на существование кода...
		try{
			const exist_code = await Secure_Code_Schema.find({send_from: send_to});
			if( exist_code.length > 0 ){
				console.log('Код существует... ')
				console.log('Удаление временного кода...');
				await Secure_Code_Schema.deleteMany({send_from: send_to});
				console.log('Временный код удалён!');
			}
		}
		catch(err){
			console.log('Ошибка проверки существующего кода: ', err);
			return reply.send({error: 'Ошибка проверки существующего кода: ', err})
		}
		// сохранение временного кода в базе данных...
		try{
			const new_code = new Secure_Code_Schema({
				send_from: send_to,
				secure_code: hashed_code,
			});
			await new_code.save();
			console.log('Новый код создан');
		}
		catch(err){
			console.log('Ошибка сохранение временного кода в базе данных: ', err);
			return reply.send({error: 'Ошибка сохранения временног окода в базе даных: ', err});
		}
		// отправка письма с проверочным кодом...
		await transporter.sendMail({
			from: process.env.JWT_NODEMAILER_FROM,
			to: send_to,
			subject: 'Ваш код подтверждения <snapp_messenger>',
			text: `Ваш код подтверждения для <snapp_messenger> : ${code}. Этот код действует в течение 1 минуты`,
		});
		// если сообщение отправлено => возвращаем код клиенту в зашифрованном виде
		console.log(`Регистрация ногово пользователя => Этап с кодом => Сообщение с кодом отправленно на указанную почту: ${send_to}`)
		return reply.send({
			message: `Сообщение с кодом отправленно на указанную почту: ${send_to}`,
			send_code: true,
		})
	}
	catch(err){
		console.log('Ошибка отправки проверочного сообщения с кодом: ', err);
		return reply.send({error: 'Ошибка отправки проверочного сообщения с кодом: ', err})
	};
});

fastify.post('/get_verify_code', async (request, reply) => {
	const email = request?.body?.email;
	if( !email ){
		console.log('Не удаётся получить проверочный код для email: ', email);
		return reply.send({error: 'Не удаётся получить проверочный код для email: ', email});
	};
	const entered_code = request?.body?.entered_code;
	if( !entered_code ){
		console.log('Не передан код для проверки');
	};
	try{	
		const code = await Secure_Code_Schema.findOne({send_from: email});
		if( !code ){
			console.log('Проверочного кода для регистрации нового профиля с email: ', email, ' не обнаружено!');
		};
		console.log('code = ', code?.secure_code);
		console.log('entered_code = ', entered_code)
		const compare_code = await bcrypt.compare(entered_code, code?.secure_code);
		if( !compare_code ){
			console.log('Код не прошёл проверку!');
			return reply.send({
				message: 'Код не прошёл проверку!',
				code: false,
			})
		};
		console.log('Код прошёл проверку: ', compare_code);
		return reply.send({
			message: 'Код прошёл проверку!',
			code: true,
		})
	}
	catch(err){
		console.log('Ошибка получения проверочных кодов: ', err);
		return reply.send({error: 'Ошибка получения временных проверочных кодов: ', err})
	};
});

fastify.post('/remove_codes', async (request, reply) => {
	try{
		console.log('Очистка хранилища с кодами...')
		await Secure_Code_Schema.deleteMany();
		console.log('Хранилище очищено!');
		return reply.send({message: 'Хранилище кодов очищено!'});
	}
	catch(err){
		console.log('Ошибка очистки хранилища с кодами: ', err);
		return reply.send({error: 'Ошибка очистки хранилища с кодами: ', err});
	}
});

fastify.post('/account/delete', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	try{

		//
		// удаляем фотографии сообщений...
		//

		async function delete_images(){
			console.log('delete_images')
			try{
				const folder = path.join(__dirname, '../../src/images/max');
				if( !folder ){
					console.log('Папка с фотографиями для сообщений не существует')
				};
				const exists_messages = await Message_Schema.find({
					$or: [
						{to: my_id},
						{from: my_id}
					]
				});

				if( exists_messages.length > 0 ){
					const images = () => {
						Array.from(exists_messages)?.forEach((message) => {
							const raw_imgs = message?.img;
							const parsed_imgs = JSON.parse(raw_imgs);
							parsed_imgs?.forEach(async(data) => {
								if( data ){
									const img_name = data?.data?.loaded_file?.name;
									const img_path = path.join(folder, img_name);
									if( img_path ){
										try{
											//удаление изображения...
											console.log(`Удаление изображения [${img_name}] из папки ${folder} ...`);
											const exist_image = await fs.access(img_path)
											.then(()=>true)
											.catch((err)=>false);
											if( exist_image ){
												await fs.unlink(img_path);
												console.log(`Изображение [${img_name}] удалено!`);
											}
											else{
												console.log('Поиск удаляемого изображения дала отрицательный результат. Изображение существует? - ', exist_image);
											};
										}
										catch(err){
											console.log(`Ошибка удаления изображения [${img_name}] из папки ${folder} : `, err);
										};
									};
								}
							})
						})
					};
					images();
				}
				else{
					console.log('Изображений не найдено!')
				}
			}
			catch(err){
				console.log('Ошибка удаления фотографий при удалении сообщений:', err)
			};
		}

		//
		// удаляем голосовые сообщения...
		//

		async function delete_voices(){
			console.log('delete_voices')
			try{
				const folder = path.join(__dirname, '../../src/audio_files');
				if( !folder ){
					console.log('Папка с голосовыми для сообщений не существует')
				};
				const exists_messages = await Message_Schema.find({
					$or: [
						{to: my_id},
						{from: my_id}
					]
				});
				if( exists_messages.length > 0 ){
					const voices = () => {
						exists_messages?.forEach(async(message) => {
							const voice_name = message?.voice;
							if( voice_name ){
								const voice_path = path.join(folder, voice_name);
								if( voice_path ){
									try{
										//удаление голосового...
										const exist_voice = await fs.access(voice_path)
										.then(()=>true)
										.catch((err)=>false)
										if( exist_voice ){
											console.log(`Удаление голосового [${voice_name}] из папки ${folder} ...`);
											await fs.unlink(voice_path);
											console.log(`Голосовое [${voice_name}] удалено!`);
										}
										else{
											console.log(`Голосовое [${voice_name}] не существует в папке ${folder}`);
										}
									}
									catch(err){
										console.log(`Ошибка удаления голосового [${voice_name}] из папки ${folder} : `, err);
									};
								}
								else{
									console.log('voice_path = ', voice_path);
								}
							};
						})
					};
					voices();
				}
				else{
					console.log('Голосовых не найдено!')
				}
			}
			catch(err){
				console.log('Ошибка удаления голосовых при удалении сообщений: ', err)
			};
		}

		//
		// очищаем избранное...
		//

		async function delete_favourites(){
			console.log('delete_favourites')
			try{
				const favourites = await Favourites_Schema.find({my_id: my_id});
				if( favourites.length > 0 ){
					favourites.forEach(async(favourite)=>{
						try{
							console.log(`Удаление избранного контента[${favourite?._id}] ...`);
							await Favourites_Schema.deleteOne({my_id: my_id});
							console.log(`Избранный контент [${favourite?._id}] удалён!`);
						}
						catch(err){
							console.log('Ошибка удаления избранного контента: ', err);
							return reply.send({error: 'Ошибка удаления избранного контента: ', err});
						}
					})
				}
				else{
					console.log('Избранного контента нет');
				}
			}
			catch(err){
				console.log('Ошибка удаления избранного контента: ', err);
			}
		}

		//
		// очищаем сообщения...
		//

		async function delete_messages(){
			console.log('delete_messages')
			try{
				console.log('Очистка сообщений при удалении...');
				const exists_messages = await Message_Schema.find({
					$or: [
						{to: my_id},
						{from: my_id}
					]
				});
				if( exists_messages.length > 0 ){
					exists_messages.forEach(async(message) => {
						// удаляем сообщение...
						console.log(`Удаление сообщения [${message?._id}] ...`);
						await Message_Schema.deleteOne({_id: message?._id});
						console.log(`Сообщение [${message?._id}] удалено!`);
					})
				}
				else{
					console.log(`Сообщений с [${my_id}] не найдено`);
				}
			}
			catch(err){
				console.log(`Ошибка очистки сообщений при удалении пользователя [${my_user?.email}] : `, err);
				return reply.send({error: `Ошибка очистки сообщений при удалении пользователя [${my_user?.email}}] : `, err});
			}
		};

		//
		// удаляем аватарку группы...
		//

		async function delete_avatar_for_group(){
			console.log('delete_avatar_for_group')
			try{
				const exist_groups = await Group_Schema.find({group_creator: my_id});
				if( exist_groups.length > 0 ){
					exist_groups.forEach(async(group)=>{
						if( group?.group_img ){
							// удаление аватарки группы...
							try{
								console.log('Удаление аватарки группы...');
								const folder_with_avatar_for_group = path.join(__dirname, '../../src/images/groups_profils');
								const exist_folder = await fs.access(folder_with_avatar_for_group)
								.then(()=>true)
								.catch((err)=>false);
								if( exist_folder ){
									const avatar_path = path.join(folder_with_avatar_for_group, group?.group_img);
									console.log('Удаление аватарки...');
									await fs.unlink(avatar_path);
									console.log(`Аватарка группы [${group?.group_name}] удалена!`);
								}
								else{
									console.log('Папка для аватарок не обнаружена...');
								}
							}
							catch(err){
								console.log(`Ошибка удаления аватарки группы [${group?.group_name}]: `, err);
							}
						};
						if( group?.group_header ){
							// удаление шапки группы...
							try{
								console.log('Удаление шапки группы...');
								const folder_with_header_for_group = path.join(__dirname, '../../src/images/groups_headers');
								const exist_folder = await fs.access(folder_with_header_for_group)
								.then(()=>true)
								.catch((err)=>false);
								if( exist_folder ){
									const header_path = path.join(folder_with_header_for_group, group?.group_header);
									console.log('Удаление шапки...');
									await fs.unlink(header_path);
									console.log(`Шапка группы [${group?.group_name}] удалена!`);
								}
								else{
									console.log('Папка для шапок не обнаружена...');
								}
							}
							catch(err){
								console.log(`Ошибка удаления шапки группы [${group?.group_name}]: `, err);
							}
						}
					});
				}
				else{
					console.log(`Групп нет`);
				};
			}
			catch(err){
				console.log('Ошибка удадления изображений из группы: ', err);
				return reply.send({error: 'Ошибка удаления изображений из группы: ', err});
			}
		};

		//
		// удаляем изображения постов группы...
		//

		async function delete_images_for_posts_in_groups(){
			console.log('delete_images_for_posts_in_groups') 
			try{
				console.log('Поиск групп...')
				const exist_groups = await Group_Schema.find({group_creator: my_id});
				if( exist_groups.length > 0 ){
					console.log('exist_groups = ', exist_groups);
					exist_groups.forEach(async(group)=>{
						const group_posts = await Post_Group_Schema.find({group_id: group?._id});
						if( group_posts.length > 0 ){
							//удаление изображений постов...
							group_posts.forEach((post)=>{
								if( post?.images ){
									const raw_images = post?.images;
									console.log('raw_images = ', raw_images)
									if( !raw_images ){
										return console.log('raw_images => post?.images пустой!');
									};
									const normal_images = JSON.parse(raw_images);
									if( normal_images ){
										normal_images.forEach(async(img,index)=>{
											console.log('')
											console.log(`[__${index}__]`)
											console.log('')
											const image_data = img?.data?.loaded_file;
											if( image_data ){
												console.log('image_data = ', image_data);
												// удаление...
												const raw_path_img = `/src/${image_data?.file_path.split('/src/')[1]}`;
												console.log('raw_path_img = ', raw_path_img);
												const last_index_slash = raw_path_img.lastIndexOf('/'); // индекс последнего /
												if( last_index_slash ){
													const raw_folder_path = `../../${raw_path_img.slice(0, last_index_slash)}`; // сырой путь к папке /groups_images/папка с изображенийми
													console.log('raw_folder_path = ', raw_folder_path)
													const folder = path.join(__dirname, raw_folder_path); // папка с изображениями
													console.log('folder = ', folder);
													if( folder ){
														const full_path_image = path.join(folder, image_data?.full_name);
														if( full_path_image ){
															try{
																console.log('Проверка существования папки группы с избражениями...');
																const exist_folder = await fs.access(folder).then(()=>true).catch((err)=>false);
																console.log('Папка существует? ', exist_folder);
																if( exist_folder ){
																	console.log(`Удаление папки с избражениями группы [${folder}] ...`);
																	await fs.rm(folder, {recursive: true, force: true});
																	console.log(`Удаление папки и изображениями [${folder}] прошло успешно!`);
																}
															}
															catch(err){
																console.log(`Ошибка удаления папки с изображениями группы [${folder}] ... `, err);
															}
														}
													}
												}
											}
										});
									}
								}
							});
						}
						else{
							console.log('Постов для группы нет')
						}
					});
				}
				else{
					console.log('Групп нет');
				};
			}
			catch(err){
				console.log('Ошибка удаления сообщений из постов в группе: ', err);
			}
		};

		// 
		// удаляем посты группы...
		// 

		async function delete_posts_for_group(){
			console.log('delete_posts_for_group')
			try{
				console.log('Поиск групп...')
				const exist_groups = await Group_Schema.find({group_creator: my_id});
				if( exist_groups.length > 0 ){
					console.log('exist_groups = ', exist_groups);
					exist_groups.forEach(async(group)=>{
						const group_posts = await Post_Group_Schema.find({group_id: group?._id});
						if( group_posts.length > 0 ){
							//удаление постов...
							console.log('Удаление постов группы...');
							await Post_Group_Schema.deleteMany({group_id: group?._id});
							console.log('Посты группы удалены!');
						}
						else{
							console.log('Постов для группы нет')
						}
					});
				}
				else{
					console.log('Групп нет');
				};
			}
			catch(err){
				console.log('Ошибка удаления фотографий групп: ', err);
			}
		}

		//
		// затем очищаем группы...
		//

		async function delete_groups(){
			console.log('delete_groups')
			try{
				const exist_groups = await Group_Schema.find({group_creator: my_id});
				if( exist_groups.length > 0 ){
					// удаление групп...
					await Group_Schema.deleteOne({group_creator: my_id});
					console.log(`Группы удалены!`);
				};
			}
			catch(err){
				console.log('Ошибка удаления групп: ', err);
				return reply.send({error: 'Ошибка удаления групп: ', err});
			}
		}

		//
		// очищаем приглашения...
		//

		async function delete_invitors(){
			console.log('delete_invitors')
			try{
				const invites = await Invites_Schema.find({
					$or: [
						{id_from: my_id},
						{id_for: my_id},
					]
				});
				if( invites.length > 0 ){
					console.log('Удаление приглашений...');
					await Invites_Schema.deleteMany({
						$or: [
							{id_from: my_id},
							{id_for: my_id},
						]
					});
					console.log('Приглашения удалены!');
				}
				else{
					console.log('Приглашений нет');
				}
			}
			catch(err){
				console.log('Ошибка удаления приглашений: ', err);
			}
		};

		//
		// удаляем аватарку пользователя...
		//

		async function delete_user_avatar(){
			try{
				const user = await User_Schema.findOne({_id: my_id});
				if( user ){
					console.log('user = ', user);
					const profil_avatar = user?.profil_avatar;
					if( profil_avatar ){
						const folder = path.join(__dirname, '../../src/images/profils/');
						const folder_exist = await fs.access(folder).then(()=>true).catch((err)=>false);
						if( folder_exist ){
							const image_path = path.join(folder, profil_avatar);
							if( image_path ){
								const image_exist = await fs.access(image_path).then(()=>true).catch((err)=>false);
								if( image_exist ){
									//удаление аватарки пользовател...
									try{
										console.log('Удаление аватарки пользователя...');
										await fs.unlink(image_path);
										console.log(`Аватарка пользователя [${profil_avatar}] успешно удалена из папки [${folder}]`);
									}
									catch(err){
										console.log('Ошибка удаления аватарки пользователя: ', err);
									}
								}
								else{
									console.log(`Не удалось обнаружить аватарку пользователя [${profil_avatar}] в папке с аватарками пользователей!`);
								}
							}
						}
						else{
							console.log('Папка с аватарками пользователей не обнаружена!');
						}
					}
					else{
						console.log('Не удалось обнаружить аватарку пользователя');
					}
				}
			}
			catch(err){
				console.log('Ошибка удаления аватарки пользователя: ', err);
			}
		};

		//
		// удаляем изображения со страницы пользователя (сразу папку)
		//

		async function delete_images_from_user_page(){
			try{
				const posts = await Post_User_Page_Schema.find({user_page_id: my_id});
				if( posts.length > 0 ){
					console.log('posts = ', posts)
					//удаление постов...
					try{
						posts.forEach((post)=>{
							const images = JSON.parse(post?.images);
							console.log('post => images = ', images);
							images.forEach(async(image)=>{
								const image_data = image?.data?.loaded_file;
								if( image_data ){
									console.log('image loaded_file = ', image_data);
									const raw_image_path = '../../src/' + image_data?.file_path.split('/src/')[1];
									if( raw_image_path ){
										const last_index_slash = raw_image_path.lastIndexOf('/');
										if( last_index_slash ){
											const folder = raw_image_path.slice(0,last_index_slash);
											if( folder ){
												const folder_path = path.join(__dirname, folder);
												const folder_exist = await fs.access(folder_path)
												.then(()=>true)
												.catch((err)=>false);
												if( folder_exist ){
													if( folder_path ){
														//удаление папки с фотографиями со страницы пользователя...
														try{
															console.log('Удаления папки с фотографиями со страницы пользователя...');
															await fs.rm(folder_path, {recursive: true, force: true});
															console.log('Папка с фотографиями со страницы пользователя успешно удалена!');
														}
														catch(err){
															console.log('Ошибка удаления папки с фотографиями со страницы пользователя: ', err);
														}
													}
												}
												else{
													console.log(`Папка с фотографиями [${folder_path}] не существует!`);
												}
											} 
										}
									}
								}
							})
						});
					}
					catch(err){
						console.log('Ошибка удаления постов со страницы пользователя...')
					}
				}
				const user_page = await User_Page_Schema.find({page_id: my_id});
				if( user_page ){
					console.log('user_page = ', user_page)
					//удаление страницы пользователя...
					try{
						console.log('Удаление страницы пользователя...');
						await User_Page_Schema.deleteOne({page_id: my_id});
						console.log('Страница пользователя уделана!');
					}
					catch(err){
						console.log('Ошибка удаления страницы пользователя...')
					}
				};
			}
			catch(err){
				console.log('Ошибка удаления изображений со страницы пользователя: ', err);
			}
		};

		//
		// и уже удаляем аккаунт
		//

		async function delete_account(){
			console.log('delete_account');
			await User_Schema.deleteMany({email: my_user?.email});
			console.log(`Аккаунт [${my_user?.email}] удалён!`)
		}

		const start_delete = async () => {
			await delete_user_avatar();
			await delete_images_from_user_page();
			await delete_images();
			await delete_voices();
			await delete_favourites();
			await delete_messages();
			await delete_avatar_for_group();
			await delete_images_for_posts_in_groups();
			await delete_invitors();
			await delete_posts_for_group();
			await delete_groups();
			await delete_account();
		}
		start_delete();
	}
	catch(err){
		console.log('Ошибка удаления профиля: ', err);
		return reply.send({error: 'Ошибка удаления профиля: ', err});
	}
	return reply.send({account_is_deleted: true});
});

fastify.post('/clear_server', async (request, reply) => {
	console.log('Очистка сервера...');
	try{
		await Message_Schema.deleteMany({});
		await Group_Schema.deleteMany({});
		await Post_Group_Schema.deleteMany({});
		await User_Page_Schema.deleteMany({});
		await Post_User_Page_Schema.deleteMany({});
		await Invites_Schema.deleteMany({});
		await Favourites_Schema.deleteMany({});
		await User_Schema.deleteMany({});
	}
	catch(err){
		console.log('Ошибка: ', err);
	}
	console.log('Очистка завершена!')
});

fastify.post('/add_posts_for_main_page', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const text = request?.body?.text?.value; // текст
	const images = request?.body?.images?.value; // изображения
	const voices = request?.body?.voices?.value; // голосовые
	const date = request?.body?.date?.value; // дата
	const from = request?.body?.from?.value; // от куда отправка. Вроде так '_'
	const group_id = request?.body?.group_id?.value; // id группы
	const user_page_id = request?.body?.user_page_id?.value; // id страницы пользователя
	const unique_token = request?.body?.unique_token?.value; // токен контента


	// НОВОСТЬ ИЗ ГРУПП


	if( group_id ){
		const checked_group_members = async () => {
			if( group_id ){
				const group = await Group_Schema.findOne({_id: group_id});
				if( !group ){
					return false;
				};
				const members = group?.group_members.map(m => m?.id);
				return members;
			}
		};
		const allow_users = await checked_group_members();

		const group = await Group_Schema.findOne({
			_id: group_id,
		});
		const group_protected = () => {
			if( group?.group_settings === '{"type_group":"Открытая","password":""}'){
				return 'opened'
			}
			else{
				return 'closed'
			}
		};

		try{
			console.log('Добавление новоcтного поста...');
			const new_post = new Posts_For_Main_Page_Schema({
				id_who_sended: my_id,
				group_id: group_id || '',
				for_users: JSON.stringify(allow_users) || 'all',
				type_post: (images && !text) ? 'img' : (!images && text) ? 'text' : (images && text) ? 'img_and_text' : (voices) && 'voice',
				text: text || '',
				images: images || [],
				voices: voices || [],
				date: date || Date.now(),
				from: from || '',
				unique_token: unique_token,
			});
			await new_post.save();
			console.log('Новостной пост добавлен!');
			return reply.send({
				message: 'Новостной пост добавлен!',
				added: true,
			})
		}
		catch(err){
			console.log('Ошибка добавления новостного поста: ', err);
			return reply.send({error: 'Ошибка добавления новостного поста: ', err});
		}
	};


	// НОВОСТЬ ИЗ USER_PAGE



	if( user_page_id ){
		const checked_user_friends = async () => {
			const friends = my_user?.friends;
			if( friends.length > 0 ){
				return friends;
			}
		};
		const allow_friends = await checked_user_friends();

		try{
			console.log('Добавление новоcтного поста...');
			const new_post = new Posts_For_Main_Page_Schema({
				id_who_sended: my_id,
				for_users: JSON.stringify(allow_friends) || 'all',
				user_page_id: user_page_id,
				type_post: (images && !text) ? 'img' : (!images && text) ? 'text' : (images && text) ? 'img_and_text' : (voices) && 'voice',
				text: text || '',
				images: images || [],
				voices: voices || [],
				date: date || Date.now(),
				from: from || '',
				unique_token: unique_token,
			});
			await new_post.save();
			console.log('[7958] Новостной пост добавлен!');
			return reply.send({
				message: 'Новостной пост добавлен!',
				added: true,
			})
		}
		catch(err){
			console.log('Ошибка добавления новостного поста: ', err);
			return reply.send({error: 'Ошибка добавления новостного поста: ', err});
		}
	}
});

fastify.post('/get_posts_for_main_page', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const friends = my_user?.friends || null;
	console.log('[get_posts_for_main_page] friends = ', friends);
	let all_posts = [];
	try{
		console.log('Получение всех новостных постов...');
		const posts = await Posts_For_Main_Page_Schema.find();
		if( posts.length > 0 ){
			console.log('Все новостные посты: ', posts);
			all_posts = posts;
		}
		else{
			console.log('Новостных постов нет!');
		};
		console.log('Получение новостных постов из групп, в которых выполнен вход...');
		const post_from_entered_groups_func = () => {
			const posts_for = [];
			all_posts.map((post)=>{
				if( post?.for_users !== 'all' && post?.user_page_id === '' ){
					const parsed_for = JSON.parse(post?.for_users);
					console.log('parsed_for = ', parsed_for)
					if( parsed_for !== undefined && parsed_for !== null ){
						parsed_for.map((member)=>{
							if( member === my_id ){
								posts_for.push(post);
							}
						});
					}
				}
			});
			if( posts_for.length > 0 ){
				console.log('Новостные посты из групп, в которых выполнен вход, получены! ', posts_for);
				return posts_for;
			}
			else{
				console.log('Новостных постов из групп, в которых выполнен выход, нет');
			};
		};
		const friends_posts_func = async () => {
			console.log('поиск новостных постов друзей...')
			if( friends.length > 0 ){
				console.log('Друзья = ', friends);
				const friends_posts = await Posts_For_Main_Page_Schema.find({
					user_page_id: {$in: friends}
				});
				if( friends_posts.length > 0 ){
					console.log('Новостные посты друзей получены: ', friends_posts);
					return friends_posts || [];
				}
				else{
					console.log('Новостных постов друзей нет');
				}
			}
			else{
				console.log('Новостных постов друзей нет');
			}
		};
		const other_posts_func = async () => {
			const other_posts_data = [];
			console.log('поиск других новостных постов из открытых групп, в которых не выполнен вход...');
			const other_groups = await Group_Schema.find({
				group_creator: {$ne: my_id},
				'group_members.id': {$ne: my_id},
				'group_settings': '{"type_group":"Открытая","password":""}',
				group_id: {$ne: ''}
			});
			if( other_groups.length > 0 ){
				console.log('группы, в которых меня нет и которые без пароля, найдены!: ', other_groups);
				// группы, в которых меня нет и которые без пароля, найдены!
				// теперь ищем новостные посты этих групп...
				const other_groups_id = other_groups.map(g => g?._id);
				const other_groups_posts = await Posts_For_Main_Page_Schema.find({
					group_id: {$in: other_groups_id}
				});
				if( other_groups_posts.length > 0 ){
					console.log('other_groups_posts = ', other_groups_posts);
					other_posts_data.push(other_groups_posts);
				}
				else{
					console.log('Новостных постов из открытых групп, в которых не выполнен вход, не найдено!')
				}
			}
			if( other_posts_data.length > 0 ){
				return other_posts_data;
			}
			else{
				return [];
			};
		};

		const friends_posts = await friends_posts_func();
		const posts_from_entered_groups = post_from_entered_groups_func();
		const other_posts = await other_posts_func();

		return reply.send({
			posts: all_posts || [],
			posts_from_entered_groups: posts_from_entered_groups || [],
			posts_friends: friends_posts || [],
			posts_other: other_posts || [],
		});
	}
	catch(err){
		console.log('Ошибка получения новостных постов: ', err);
		return reply.send({error: 'Ошибка получения новостных постов: ', err});
	};
});

fastify.post('/clear_posts_for_main_page', async (request, reply) => {
	try{
		console.log('Удаление новостных постов...');
		await Posts_For_Main_Page_Schema.deleteMany();
		console.log('Новостные посты удалены!');
	}
	catch(err){
		console.log('Ошибка удаления новостных постов: ',err);
	}
});

fastify.post('/remove_news', async (request, reply) => {
	const raw_token = request.headers.authorization;
	if( !raw_token ){
		return reply.status(400).send({error: 'Заголовок пустой'});
	};
	if( raw_token.split(' ')[0] !== `Bearer` ){
		return reply.status(400).send({error: 'Некорректный токен'});
	};
	const token = raw_token.split(' ')[1];
	if( !token ){
		return reply.status(400).send({error: 'Токен не передан'});
	}
	const decoded = jwt.verify(token, process.env.JWT_SECRET_FIRST);
	if( !decoded ){
		return reply.status(401).send({error: 'Ошибка расшифровки токена'});
	};
	const my_id = decoded.id;
	if( !my_id ){
		return reply.status(401).send({error: 'Не удалось распознать ID вашего аккаунта'});
	}
	const my_user = await User_Schema.findOne({_id: my_id});
	if( !my_user ){
		console.log('Пользователь не найден!');
		return reply.status(401).send({error: 'Пользователь не найден!'});
	};
	const unique_token = request?.body?.unique_token || ''

	try{
		if( !unique_token ){
			throw 'Уникальный токен контента не передан';
		};
		const content = await Posts_For_Main_Page_Schema.findOne({unique_token: unique_token});
		if( !content ){
			console.log('Новостного контента нет');
		};
		try{
			await Posts_For_Main_Page_Schema.deleteOne({unique_token: unique_token});
			console.log('Новостной контент удалён! ');
			return reply.send({message: 'Новостной контент удалён!'});
		}
		catch(err){
			throw err;
		}
	}
	catch(err){
		console.log('Ошибка удаления новости: ', err);
	}
});

async function connectRedis(){
	const { createClient } = require('redis');
	const redisClient = createClient();
	redisClient.on('error', (err)=>{
		console.log('Ошибка redis: ', err);
		process.exit(1);
	})
	redisClient.connect()
	.then(()=>{
		console.log('Redis подключен к fastify');
	})
	.catch((err)=>{
		console.log('Ошибка redis: ', err);
		process.exit(1);
	});
	fastify.decorate('redis', redisClient);
};

async function Start(){
	await connectRedis();
	try{
		const server = await fastify.listen({port: 8080, host: '0.0.0.0'});
		console.log('сервер запущен! порт 8080');
	}
	catch(err){
		console.log('Ошибка запуска сервера: ', err);
		process.exit(1);
	}
};