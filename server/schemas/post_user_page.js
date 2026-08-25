const mongoose = require('mongoose');

const Post_User_Page_Schema = new mongoose.Schema({
	user_page_id: {
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
	from: {
		type: Object,
		required: true,
	},
	date: {
		type: Date,
		default: Date.now,
	},
	changed: {
		type: Boolean,
		default: false,
	},
	role: {
		type: String,
		required: true,
	},
	type_post: {
		type: String,
		required: true,
	},
	hide: {
		type: String,
		default: false,
	}
});

const post_user_page_model = new mongoose.model('post_user_page', Post_User_Page_Schema);
module.exports = post_user_page_model;