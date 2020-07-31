const logger = require('log4js').getLogger();
logger.level = process.env.PRODUCTION ? 'info' : 'debug';
logger.info(`osu!canada bot v${process.env.npm_package_version}`);

const { Client, Collection } = require('discord.js');
const { BanchoClient } = require('bancho.js');
const { readdirSync } = require('fs');

const database = require('./database');
const Cfg = require('./config.json');

const discord = new Client();
const bancho = new BanchoClient(Cfg.bancho);
discord.commands = new Collection();
bancho.commands = new Collection();

const discordCommands = readdirSync('./discord').filter((f) => f.endsWith('.js'));
const banchoCommands = readdirSync('./bancho').filter((f) => f.endsWith('.js'));

for (const file of discordCommands) {
	const command = require(`./discord/${file}`);
	discord.commands.set(command.name, command);
}

for (const file of banchoCommands) {
	const command = require(`./bancho/${file}`);
	bancho.commands.set(command.name, command);
}

database.connection
	.authenticate()
	.then(async () => {
		await database.connection.sync();
		logger.info('Connection to database established!');
		await discord.login(Cfg.discordToken);
		await bancho.connect();
	})
	.catch((err) => logger.error('Database connection error:', err));

discord.once('ready', () => logger.info('Connection to Discord established!'));
bancho.once('connected', () => logger.info('Connection to Bancho established!'));

discord.on('message', (message) => {
	if (!message.content.startsWith(Cfg.prefix) || message.author.bot) return;

	const args = message.content.slice(Cfg.prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	if (!discord.commands.has(commandName)) return;

	const command = discord.commands.get(commandName);

	if (command.dmOnly && message.channel.type !== 'dm') return;

	if (command.adminOnly && message.author.id !== Cfg.dev) return;

	try {
		logger.debug(`Command Executed (${message.author.tag}):`, command.name, args);
		command.execute(message, args, database);
	} catch (error) {
		logger.error(`Command Execution (${commandName}):`, error);
		message.reply('An error occured, please contact **Eton#4446**.');
	}
});

bancho.on('PM', (message) => {
	if (message.user.ircUsername == Cfg.bancho.username) return;
	if (!message.message.startsWith(Cfg.prefix)) return;

	const args = message.message.slice(Cfg.prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	if (!bancho.commands.has(commandName)) return;

	const command = bancho.commands.get(commandName);

	if (command.dmOnly && message.channel.type !== 'dm') return;

	try {
		logger.debug(`Command Executed (${message.user.ircUsername}):`, command.name, args);
		command.execute(message, args, database, discord);
	} catch (error) {
		logger.error(`Command Execution (${commandName}):`, error);
		message.user.sendMessage('[osu!canada Bot] An error occured, please contact **Eton#4446**.');
	}
});
