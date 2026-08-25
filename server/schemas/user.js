const mongoose = require('mongoose');

const user_schema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	pass: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now(),
	},
	security_code: {
		type: Number,
		default: null,
	},
	t_number: {
		type: Number,
		default: null,
	},
	profil_avatar: {
		type: String,
		default: null,
	},
	last_activity: {
		type: Date,
		default: null,
	},
	last_page: {
		type: Object,
		default: {
			last_page: '',
			group_password: '',
		},
	},
	role: {
		type: String,
		default: 'user',
	},
	permissions: {
		type: Array,
		default: [],
	},
	life_account: {
		type: Date,
		default: Date.now() + 1000 * 60 * 60 * 24 * 365,
	},
	active_session: {
		type: Array,
		default: [],
	},
	friends: {
		type: Array,
		default: [],
	},
	waiting_add_friends: {
		type: Array,
		default: [],
	},
	waiting_confirm_friends: {
		type: Array,
		default: [],
	},
	settings: {
		type: Array,
		default: [],
	},
	page_data: {
		type: Array,
		default: [],
	},
	online: {
		type: Boolean,
		default: false,
	},
	waiting_join_in_group: {
		type: String,
		default: null,
	}
});

const user = new mongoose.model('users', user_schema);
if( !user ){
	return console.log('Ошибка создания модели <user>');
};

module.exports = user;