const mongoose = require('mongoose');

const Secure_Schema = new mongoose.Schema({
	send_from: {
		type: String,
		required: true,
	},
	secure_code: {
		type: String,
		required: true,
	},
});

Secure_Schema.index({
	expiresAt: 1
},
{
	expireAfterSeconds: 60
})

const Secure_Model = new mongoose.model('secure', Secure_Schema);

module.exports = Secure_Model;