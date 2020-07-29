const mongoose = require('mongoose');

const codeSchema = new mongoose.Schema({
	code: String,
	discord: String,
	time: String
});

const Code = mongoose.model('Code', codeSchema);

module.exports = Code;
