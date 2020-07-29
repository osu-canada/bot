const Link = require('../models/link');
const Code = require('../models/code');
const { tokenTimeout } = require('../config.json');
const { v4: uuidv4 } = require('uuid');

module.exports = {
	name: 'link',
	description: 'Get a code to link your Discord to your osu! account.',
	dmOnly: true,
	execute: (message, args) => {
		let record = Link.findOne({ discord: message.author.id });
		if (record[0]) return message.channel.send('Your account is already linked to an osu! account!');
		let code = uuidv4();

		record = Code.findOne({ discord: message.user.id });
		if (record[0] && Date.now() - record.time < tokenTimeout)
			return message.channel.send(
				`You already have an active code,to link your account, please open osu! and DM **Eton4446** with \`!link ${record.code}\`. `
			);

		record = new Code();
		(record.discord = message.author.id), (record.code = code);
		record.time = Date.now();
		record.save();

		message.channel.send(
			`In order to link your account, please open osu! and DM **Eton4446** with \`!link ${code}\`. This code will expire in 5 minutes.`
		);
	}
};
