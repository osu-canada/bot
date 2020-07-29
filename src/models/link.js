const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
	discord: String,
	osu: String
});

const Link = mongoose.model('Link', linkSchema);

module.exports = Link;
