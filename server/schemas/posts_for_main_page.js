const mongoose = require('mongoose');

const Posts_For_Main_Page = new mongoose.Schema({
	id_who_sended: {
		type: String,
		required: true,
	},
	group_id: {
		type: String,
		default: ''
	},
	user_page_id: {
		type: String,
		default: ''
	},
	for_users: {
		type: String,
		default: "all",
	},
	type_post: {
		type: String,
		required: true,
	},
	text: {
		type: String,
		default: '',
	},
	images: {
		type: Array,
		default: [],
	},
	voices: {
		type: Array,
		default: [],
	},
	date: {
		type: Date,
		default: Date.now(),
	},
	from: {
		type: String,
	},
	unique_token: {
		type: String,
		default: '',
	},
});

const Model_Posts_For_Main_Page = new mongoose.model('posts_main_page', Posts_For_Main_Page);

module.exports = Model_Posts_For_Main_Page;