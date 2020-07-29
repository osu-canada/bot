const Mongoose = require('mongoose');

const accountLinkSchema = new Mongoose.Schema({
	discord: String,
	osu: String,
	createdAt: String
});

module.exports = Mongoose.model('AccountLink', accountLinkSchema);
