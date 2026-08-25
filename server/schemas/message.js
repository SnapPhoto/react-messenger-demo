const mongoose = require('mongoose');

const message_schema = new mongoose.Schema({
	to: {
		type: String,
		required: true,
	},
	from: {
		type: String,
		required: true,
	},
	status: {
		type: String,
		default: 'uncheck',
	},
	date: {
		type: Date,
		default: Date.now,
	},
	changed: {
		type: Boolean,
		default: false,
	},
	message: {
		type: Object,
		default: '',
	},
	img: {
		type: String,
		default: null,
	},
	imgs: {
		type: Array,
		default: [],
	},
	voice: {
		type: String,
		default: null,
	},
	name_sender: {
		type: String,
		required: true,
	},
	name_to_send: {
		type: String,
		required: true,
	},
	type: {
		type: String,
		required: true,
	}
});

const message_model = new mongoose.model('Messages', message_schema);

module.exports = message_model;