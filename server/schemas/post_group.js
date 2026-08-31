const mongoose = require('mongoose');

const Post_Group_Schema = new mongoose.Schema({
	group_id: {
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
	group_id: {
		type: String,
		default: '',
		required: true,
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
	},
	unique_token: {
		type: String,
		default: ''
	}
});

const post_group_model = new mongoose.model('post_group', Post_Group_Schema);
module.exports = post_group_model;