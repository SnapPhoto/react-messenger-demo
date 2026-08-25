const mongoose = require('mongoose');

const Invites_Schema = new mongoose.Schema({
	id_from: {
		type: String,
		required: true,
	},
	id_for: {
		type: String,
		required: true,
	},
	invite_data: {
		type: Object,
		required: true,
	}
});

const Invites = new mongoose.model('invites', Invites_Schema);
if( !Invites ){
	return console.log('Ошибка создания схемы invites');
};

module.exports = Invites;