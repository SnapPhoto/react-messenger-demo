const mongoose = require('mongoose');

const Current_Message_Schema = new mongoose.Schema({
	to: {
		type: String,
		required: true,
	},
	from: {
		type: String,
		required: true.
	},
	
});

const Current_Message = new mongoose.model('C_M_S', Current_Message_Schema);

module.exports Current_Message;