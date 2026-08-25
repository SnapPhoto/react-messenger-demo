const mongoose = require('mongoose');

const Favourites_Schema = new mongoose.Schema({
	type: {
		type: String,
		required: true,
	},
	content_id: {
		type: String,
		required: true,
	},
	content_my_id: {
		type: String,
		default: null,
	},
	content_data: {
		type: Object,
		default: null,
	},
	content_user_name: {
		type: String,
		default: null,
	},
	content_group_name: {
		type: String,
		default: null,
	},
	my_id: {
		type: String, 
		required: true,
	},
});

const Favourites_Model = new mongoose.model('favourites', Favourites_Schema);

module.exports = Favourites_Model;