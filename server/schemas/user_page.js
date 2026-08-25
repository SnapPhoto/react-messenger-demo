const mongoose = require('mongoose');

const user_page_schema = new mongoose.Schema({
	page_id: {
		type: String,
		required: true,
	},
	posts: {
		type: Array,
		default: [],
	},
});

const user_page = new mongoose.model('user_page', user_page_schema);
if (!user_page){
	return console.error('Ошибка при создании <user_page>'); 
};

module.exports = user_page;