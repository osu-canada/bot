const logger = require('log4js').getLogger();
logger.level = process.env.PRODUCTION ? 'info' : 'debug';

const jwt = require('jsonwebtoken');
const { MessageEmbed } = require('discord.js');
const { prefix, jwtKey } = require('../config.json');

module.exports = {
	name: 'verify',
	dmOnly: true,
	execute: async (message, args, { AccountLink }) => {
		let potentialLink = await AccountLink.findOne({ where: { discord: message.author.id } });
		if (potentialLink) {
			logger.warn(`Account Link (${message.author.tag}):`, 'Account already linked to osu! account.');
			return message.channel.send("Sorry, you've already linked this Discord account to an osu! account.");
		}

		let token = jwt.sign({ u: message.author.id }, jwtKey, { expiresIn: '5m' });
		logger.info(`Account Link (${message.author.tag}):`, 'User requested verification token.');
		let embed = new MessageEmbed()
			.setTitle('Account Verification')
			.setColor('#66ccff')
			.setDescription(
				'To verify your account, open the osu! game client, and DM the user `Eton4446` with the following.'
			)
			.addField('Verification Code', `\`\`\`${prefix}verify ${token}\`\`\``);
		message.channel.send(embed);
	}
};
