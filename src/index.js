const Discord = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const { prefix, auth } = require('./config.json');

const { BanchoClient } = require('bancho.js');

mongoose.connect(auth.mongo, {
	useNewUrlParser: true,
	useUnifiedTopology: true
});

const bancho = new BanchoClient({
	username: auth.banchousr,
	password: auth.banchopass
});

const client = new Discord.Client();
const commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.set(command.name, command);
}

client.once('ready', () => {
	console.log(`Connected to Discord as ${client.user.tag}`);
});

client.on('message', (message) => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	if (!commands.has(commandName)) return;

	const command = commands.get(commandName);

	if (command.dmOnly && message.channel.type !== 'dm') return;

	try {
		command.execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
});

client.login(auth.discord);
