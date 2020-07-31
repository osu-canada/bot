const logger = require('log4js').getLogger();
logger.level = process.env.PRODUCTION ? 'info' : 'debug';

const { default: fetch } = require('node-fetch');
const { Bitfield } = require('errorsparty.dev-bitfield');
const { bancho } = require('../config.json');

const modEnums = require('../modEnums');
const { MessageEmbed } = require('discord.js');

module.exports = {
	name: 'recent',
	execute: async (message, args, { AccountLink }) => {
		let user = message.mentions.users.first() || message.author;

		let record = await AccountLink.findOne({ where: { discord: user.id } });
		if (!record) return message.reply('that user has not linked their osu! account.');

		fetch(`https://osu.ppy.sh/api/get_user_recent?k=${bancho.apiKey}&u=${record.osu}&limit=1&type=id`)
			.then((res) => res.json())
			.then(async (json) => {
				let scoreData = json[0];
				if (!scoreData) return message.reply('no recent plays found for that user.');

				let modsBit = new Bitfield(BigInt(scoreData.enabled_mods));

				let mods = parseMods(modsBit);

                let bmData = await fetch(`https://osu.ppy.sh/api/get_beatmaps?k=${bancho.apiKey}&b=${scoreData.beatmap_id}`).then(res => res.json());
                let usrData = await fetch(`https://osu.ppy.sh/api/get_user?k=${bancho.apiKey}&u=${record.osu}&type=id`).then(res => res.json());

                bmData = bmData[0];
                usrData = usrData[0];

                let embed = new MessageEmbed()
                    .setColor('#66ccff')
                    .setAuthor(usrData.username, `http://s.ppy.sh/a/${record.osu}`)
                    .setThumbnail(`https://b.ppy.sh/thumb/${bmData.beatmapset_id}l.jpg`)
                    .setTitle(`${bmData.title} [${bmData.version}]${mods ? ` +${mods}` : ''} ${Number(bmData.difficultyrating).toFixed(2)}★`)
                    .addField('Rank', scoreData.rank == 'F' ? 'Failed' : `${ranks[scoreData.rank]} Rank`, true)
                    .addField('Misses', `${scoreData.countmiss}x`, true)
                    .addField('Score', addCommas(scoreData.score), true)
                    .addField('Max Combo', `${scoreData.maxcombo}x`, true)
                    .addField('300/100/50', `${scoreData.count300}/${scoreData.count100}/${scoreData.count50}`, true)
                    .setTimestamp(scoreData.date);

                message.channel.send(embed);

			});
	}
};

const parseMods = (bits) => {
	if (bits.get() === 0n) return null;
	const mods = [];
	for (let key in modEnums) {
		if (bits.has(modEnums[key])) mods.push(key);
	}
	return mods.join('');
};

function addCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

let ranks = {
    XS: 'SS',
    XH: 'SS',
    SH: 'S',
    S: 'S',
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D'
}