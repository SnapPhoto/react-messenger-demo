const mongoose = require('mongoose');

const Group_Schema = new mongoose.Schema({
	group_name: {
		type: String,
		require: true,
	},
	group_people_count: {
		type: Number,
		default: 0,
	},
	group_date_create: {
		type: Date,
		default: Date.now(),
	},
	group_settings: {
		type: Object,
		default: {},
	},
	group_img: {
		type: Object,
		default: {},
	},
	group_header: {
		type: String,
		default: '',
	},
	group_members: {
		type: Array,
		default: []
	},
	group_time_live: {
		type: Date,
		default: Date.now() + 1000 * 60 * 60 * 24 * 365,
	},
	group_titles: {
		type: String,
		default: '',
	},
	group_admins: {
		type: Array,
		default: [],
		required: true,
	},
	content: {
		type: Object,
		default: {
			body: [],
		}
	},
	group_creator: {
		type: String,
		require: true,
	},
	group_bad_requests: {
		type: Array,
		default: [],
	}
});

const Group = new mongoose.model('Group', Group_Schema);

module.exports = Group;