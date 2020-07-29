const Mongoose = require('mongoose');

const tokenStoreSchema = new Mongoose.Schema({
	_id: String,
	token: String,
	expires: String
});

module.exports = Mongoose.model('TokenStore', tokenStoreSchema);
