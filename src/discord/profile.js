const logger = require('log4js').getLogger();
logger.level = process.env.PRODUCTION ? 'info' : 'debug';

const fetch = require('node-fetch');
const moment = require('moment');
const { MessageEmbed } = require('discord.js');
const { bancho } = require('../config.json');

module.exports = {
	name: 'profile',
	execute: async (message, args, { AccountLink }) => {
		let user = message.mentions.users.first() || message.author;

		let record = await AccountLink.findOne({ where: { discord: user.id } });
		if (!record) return message.reply('that user has not linked their osu! account.');

		fetch(`https://osu.ppy.sh/api/get_user?k=${bancho.apiKey}&u=${record.osu}&type=id`)
			.then((res) => res.json())
			.then((json) => {
				let data = json[0];
				if (!data)
					return message.reply(
						'osu! user could not be found, this should never happen so please message **Eton#4446**.'
					);
				let embed = new MessageEmbed()
					.setColor('#66ccff')
					.setAuthor(user.username, user.avatarURL() || user.defaultAvatarURL)
					.setTitle(`Profile of ${data.username}`)
					.setThumbnail(`http://s.ppy.sh/a/${record.osu}`)
					.addField(
						'Rank (Country)',
						`#${addCommas(data.pp_rank)} (${data.country} #${addCommas(data.pp_country_rank)})`,
						true
					)
					.addField('pp', `${addCommas(Math.floor(data.pp_raw))}pp`, true)
					.addField('Hours', `${(data.total_seconds_played / 60 / 60).toFixed(1)} Hours`, true)
					.addField('Level', data.level, true)
					.addField('Playcount', addCommas(data.playcount), true)
					.addField('Accuracy', `${Number(data.accuracy).toFixed(2)}%`, true)
					.addField('Date Joined', moment(data.join_date).format('MMM YYYY'), true)
					.addField('Ranked Score', addCommas(data.ranked_score), true)
					.addField('Total Score', addCommas(data.total_score), true)
					.addField(
						'300/100/50',
						`${addCommas(data.count300)}/${addCommas(data.count100)}/${addCommas(data.count50)}`,
						true
					)
					.addField(
						'SS/S/A',
						`${addCommas(data.count_rank_ss)}/${addCommas(data.count_rank_s)}/${addCommas(
							data.count_rank_a
						)}`,
						true
					);
				message.channel.send(embed);
			});
	}
};

function addCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
