const { Client } = require('discord.js');
const { BanchoClient } = require('bancho.js');
const Mongoose = require('mongoose');
const Moment = require('moment');
const { v4: uuid } = require('uuid');

console.log(`osu!canada bot v${process.env.npm_package_version}`);

const AccountLink = require('./models/accountLink');
const TokenStore = require('./models/tokenStore');
const { prefix, auth, tokenTimeout, guild } = require('./config.json');
let MasterGuild;

const discord = new Client();
const bancho = new BanchoClient({
	username: auth.banchousr,
	password: auth.banchopass,
	apiKey: auth.osuapi
});

Mongoose.connect(auth.mongo, { useNewUrlParser: true, useUnifiedTopology: true });
const db = Mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB Connection Error:'));
db.once('open', () => {
	console.log('Connected to MongoDB!');
	discord.login(auth.discord);
	bancho.connect();
});

discord.once('ready', () => {
	MasterGuild = discord.guilds.cache.find((g) => g.id == guild);
	discord.user.setActivity({ type: 'WATCHING', name: 'canadians click circles!' });
	console.log('Connected to Discord!');
});

discord.on('guildMemberRemove', async (member) => {
	if (!AccountLink.exists({ discord: member.id })) return;
	await AccountLink.deleteOne({ discord: member.id });
	console.log(`[Discord] (${member.user.tag}) Account link deleted, member left server.`);
});

discord.on('message', async (message) => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;
	if (message.channel.type !== 'dm') return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

	if (command == 'verify') {
		let accLink = await AccountLink.exists({ discord: message.author.id });
		if (accLink) {
			console.log(
				`[Discord] (${message.author
					.tag}) Attempted to generate verification token, but account was already linked.`
			);
			return message.channel.send(`This discord account is already linked to a osu! account.`);
		}

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
				console.log(
					`[Discord] (${message.author.tag}) Requested a verification token, but a valid one already existed.`
				);
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
			console.log(`[Discord] (${message.author.tag}) Requested a verification token.`);
			message.channel.send(
				`In order to link your account, please open osu! and DM **Eton4446** with \`${prefix}verify ${token.token}\`. This code will expire in 5 minutes.`
			);
		});
	}
});

bancho.once('connected', () => console.log('Connected to Bancho!'));

bancho.on('PM', async (message) => {
	if (message.user.ircUsername == auth.banchousr) return;
	if (!message.message.startsWith(prefix)) return;

	let user = await message.user.fetchFromAPI();

	const args = message.message.slice(prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

	if (command == 'verify') {
		let accLink = await AccountLink.exists({ osu: message.user.ircUsername });
		if (accLink) {
			console.log(`[Bancho] (${user.username}) Attempted to verify already linked account.`);
			return message.user.sendMessage(
				'[osu!canada Bot] This osu! account is already linked to a Discord account.'
			);
		}

		let token = args[0];
		if (!token) {
			console.log(`[Bancho] (${user.username}) Attempted to verify but provided no token.`);
			return message.user.sendMessage(
				'[osu!canada Bot] You must provide a verification token. (eg. !verify 5b7d10b6-f71a-4723-b70f-45e9cc4bb927)'
			);
		}

		let exists = await TokenStore.exists({ token: token });
		if (!exists) {
			console.log(`[Bancho] (${user.username}) Attempted to verify with invalid token.`);
			return message.user.sendMessage('[osu!canada Bot] The token you provided is invalid!');
		}

		let record = await TokenStore.findOne({ token: token });

		if (user.country !== 'CA') {
			console.log(`[Bancho] (${user.username}) Country set as ${user.country}, not CA.`);
			await TokenStore.deleteOne({ token: token });
			return message.user.sendMessage(
				"[osu!canada Bot] Sorry, your osu! account cannot be linked as it's country is not Canada. If you are located in Canada but created your account in another country, please message Eton#4446 on Discord."
			);
		}

		if (record.expires < Date.now()) {
			console.log(`[Bancho] (${user.username}) Attempted to verify with expired token.`);
			await TokenStore.deleteOne({ token: token });
			return message.user.sendMessage('[osu!canada Bot] The token you provided is expired!');
		}

		const discordUser = await MasterGuild.members.cache.find((u) => u.id == record._id);

		if (!discordUser) {
			console.log(`[Bancho] (${user.username}) Attempted to verify to invalid Discord account.`);
			await TokenStore.deleteOne({ token: token });
			return message.user.sendMessage(
				'[osu!canada Bot] The user that token is for is no longer in the osu!canada Discord.'
			);
		}

		const accountLink = new AccountLink();
		accountLink.osu = user.username;
		accountLink.discord = discordUser.id;

		accountLink.save(async (err, al) => {
			if (err) {
				console.error(err);
				return message.user.sendMessage(
					'[osu!canada Bot] An error occured. Please open an issue; https://github.com/osu-canada/bot/issues'
				);
			}
			console.log(
				`[Bancho] (${user.username}) Linked osu! user ${user.username} to Discord user ${discordUser.user.tag}`
			);
			await TokenStore.deleteOne({ token: token });
			await discordUser.setNickname(user.username, `Linked to osu! account ${user.username}`);
			await discordUser.roles.add('737836870687391814');
			message.user.sendMessage(
				`Successfully linked osu! user "${user.username}" to Discord user "${discordUser.user.tag}".`
			);
		});
	}
});
