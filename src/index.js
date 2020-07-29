const Discord = require('discord.js');
const config = require('./config.json').discord;
const client = new Discord.Client();

const { BanchoClient } = require('bancho.js');
const creds = require('./config.json').bancho;
const bancho = new BanchoClient({
	username: creds.username,
	password: creds.password
});

const linkStore = new Discord.Collection();

const { v4: uuidv4 } = require('uuid');

// Discord shit
client.once('ready', () => {
	console.log(`Connected to Discord as ${client.user.tag}`);
});

client.on('message', (message) => {
	if (!message.content.startsWith(config.prefix) || message.author.bot) return;

	const args = message.content.slice(config.prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

	switch (command) {
		case 'link':
			if (message.channel.type !== 'dm') return;
			let code = uuidv4();
			linkStore.set(code, { user: message.author.id, time: Date.now() });
			message.channel.send(
				`In order to link your account, please open osu! and DM **Eton4446** with \`!link ${code}\`. This code will expire in 5 minutes.`
			);
			break;
	}
});

// Bancho Shit
bancho.on('connected', () => {
	console.log('Connected to Bancho!');
});

bancho.on('PM', (message) => {
	if (message.user.ircUsername == creds.username) return;
	if (!message.message.startsWith(creds.prefix)) return;

	const args = message.message.slice(creds.prefix.length).split(/ +/);
	const command = args.shift().toLowerCase();

	console.log(`[${message.user.ircUsername}] ${message.message}`);

	switch (command) {
		case 'link':
			if (!args[0]) return message.user.sendMessage('You must provide a code!');
			if (!linkStore.has(args[0])) return message.user.sendMessage('Invalid code provided!');
			let data = linkStore.get(args[0]);
			if (Date.now() - data.time > config.tokenTimeout) {
				linkStore.delete(args[0]);
				message.user.sendMessage(
					'The code you provided has expired, please DM osu!canada bot to get a new code!'
				);
				return;
			}
			let guild = client.guilds.cache.find((g) => g.id == config.guild);
			let usr = guild.members.cache.find((u) => u.user.id == data.id);
			usr.setNickname(message.user.ircUsername);
			message.user.sendMessage(
				`Successfully linked osu! account ${message.user.ircUsername} to Discord account ${usr.user.tag}.`
			);
	}
});

// Connections
client.login(config.token);
bancho.connect();
