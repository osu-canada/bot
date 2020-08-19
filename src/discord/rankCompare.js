const { default: fetch } = require('node-fetch');
const { bancho } = require('../config.json');
const { Message, MessageEmbed } = require('discord.js');

const logger = require('log4js').getLogger();
logger.level = process.env.PRODUCTION ? 'info' : 'debug';

module.exports = {
	name: 'compareuser',
	execute: async (message, args, { AccountLink }) => {
		let usr1 = message.mentions.users.array()[1] || message.author;
		let usr2 = message.mentions.users.first();

		if (!usr2) return message.reply('you must @mention a user!');

		let record1 = await AccountLink.findOne({ where: { discord: usr1.id } });
		if (!record1) return message.reply(`You must link your osu! account first!`);

		let record2 = await AccountLink.findOne({ where: { discord: usr2.id } });
		if (!record2) return message.reply('That user has not linked their osu! account!');

		let data1 = await fetch(
			`https://osu.ppy.sh/api/get_user?k=${bancho.apiKey}&u=${record1.osu}&type=id`
		).then((res) => res.json());
		let data2 = await fetch(
			`https://osu.ppy.sh/api/get_user?k=${bancho.apiKey}&u=${record2.osu}&type=id`
		).then((res) => res.json());

		data1 = data1[0];
		data2 = data2[0];

		let compare = {
			usr1: {
				rank: parseInt(data1.pp_rank),
				pp: parseInt(data1.pp_raw)
			},
			usr2: {
				rank: parseInt(data2.pp_rank),
				pp: parseInt(data2.pp_raw)
			}
		};

		let rankCompare = compare.usr1.rank - compare.usr2.rank;
		let ppCompare = compare.usr1.pp - compare.usr2.pp;

		let embed = new MessageEmbed()
			.setColor('#66ccff')
			.setTitle(`Comparison of ${data1.username} vs ${data2.username}!`)
			.addField(`${data1.username}'s Rank`, `#${addCommas(compare.usr1.rank)}`, true)
			.addField(`Rank Difference`, `${rankCompare > 0 ? '+' : ''}${addCommas(rankCompare)}`, true)
			.addField(`${data2.username}'s Rank`, `#${addCommas(compare.usr2.rank)}`, true)
			.addField(`${data1.username}'s pp`, `${addCommas(compare.usr1.pp)} pp`, true)
			.addField(`pp Difference`, `${ppCompare > 0 ? '+' : ''}${addCommas(ppCompare)} pp`, true)
			.addField(`${data2.username}'s pp`, `${addCommas(compare.usr2.pp)} pp`, true);

		message.channel.send(embed);
	}
};

function addCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
