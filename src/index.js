const { Client } = require('discord.js');
const Mongoose = require('mongoose');
const Moment = require('moment');
const { v4: uuid } = require('uuid');

const AccountLink = require('./models/accountLink');
const TokenStore = require('./models/tokenStore');
const { prefix, auth, tokenTimeout } = require('./config.json');

const discord = new Client();

Mongoose.connect(auth.mongo, { useNewUrlParser: true, useUnifiedTopology: true });
const db = Mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB Connection Error:'));
db.once('open', () => {
	console.log('Connected to MongoDB!');
	discord.login(auth.discord);
});

discord.once('ready', () => {
	console.log('Connected to Discord!');
});

discord.on('message', async (message) => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;
	if (message.channel.type !== 'dm') return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

	if (command == 'verify') {
		let accLink = await AccountLink.exists({ discord: message.author.id });
		if (accLink) return message.channel.send(`This discord account is already linked to a osu! account.`);

		let existingToken = await TokenStore.exists({ _id: message.author.id });
		if (existingToken) {
			let token = TokenStore.findOne({ _id: message.author.id });
			if (token.expires < Date.now()) {
				await TokenStore.deleteOne({ _id: token._id });
				token = new TokenStore();
				token._id = message.author.id;
				token.token = uuid();
				token.expires = Date.now() + tokenTimeout;
				token.save((err, token) => {
					if (err) {
						console.error(err);
						return message.channel.send('Sorry, an error occured. Please contact **Eton#4446**.');
					}
					message.channel.send(
						`In order to link your account, please open osu! and DM **Eton4446** with \`${prefix}verify ${token.token}\`. This code will expire in 5 minutes.`
					);
				});
			} else {
				let token = await TokenStore.findOne({ _id: message.author.id });
				message.channel.send(`You already have a verification token. It is \`${prefix}verify ${token.token}\``);
				return;
			}
		}

		let token = new TokenStore();
		token._id = message.author.id;
		token.token = uuid();
		token.expires = Date.now() + tokenTimeout;
		token.save((err, token) => {
			if (err) {
				console.error(err);
				return message.channel.send('Sorry, an error occured. Please contact **Eton#4446**.');
			}
			console.log(`[${message.author.tag}] Requested a verification token.`);
			message.channel.send(
				`In order to link your account, please open osu! and DM **Eton4446** with \`${prefix}verify ${token.token}\`. This code will expire in 5 minutes.`
			);
		});
	}
});
