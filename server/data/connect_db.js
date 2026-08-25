const mongoose = require('mongoose');

async function connect_db(){
	try{
		console.log('Подключение к базе данных...');
		await mongoose.connect(process.env.JWT_DBCONNECT);
		console.log('Подключение к базе данных установлено!');
	}
	catch(err){
		console.error('Ошибка подключения к базе данных: ', err);
	}
};

module.exports = connect_db;