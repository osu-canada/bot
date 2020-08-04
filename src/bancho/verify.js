const logger = require('log4js').getLogger();
logger.level = process.env.PRODUCTION ? 'info' : 'debug';

const jwt = require('jsonwebtoken');
const { MessageEmbed } = require('discord.js');
const { jwtKey, guildID } = require('../config.json');
const prefix = '[osu!canada Bot]';

module.exports = {
    name: 'verify',
    execute: async (message, args, { AccountLink }, discord) => {
        await message.user.fetchFromAPI();
        let potentialLink = await AccountLink.findOne({ where: { osu: message.user.id } });
        if (potentialLink) {
            logger.warn(`Account Link (${message.user.username}):`, 'Account already linked to Discord account.');
            return message.user.sendMessage(
                `${prefix} Sorry, you've already linked this osu! account to an Discord account.`
            );
        }

        let token = args[0];
        if (!token) {
            logger.warn(`Account Link (${message.user.username}):`, 'Didnt provide verification token.');
            return message.user.sendMessage(`${prefix} You must provide a verification token.`);
        }

        jwt.verify(token, jwtKey, async (err, decoded) => {
            if (err) {
                switch (err.name) {
                    case 'TokenExpiredError':
                        logger.warn(`Account Link (${message.user.username}):`, 'User provided expired token.');
                        return message.user.sendMessage(`${prefix} The token you provided has expired.`);
                        break;
                    case 'JsonWebTokenError':
                        logger.warn(`Account Link (${message.user.username}):`, 'User provided invalid token.');
                        return message.user.sendMessage(`${prefix} The token you provided is invalid.`);
                        break;
                    default:
                        logger.error(`Account Link (${message.user.username}):`, err);
                        return message.user.sendMessage(
                            `${prefix} An error occured, please report this to Eton#4446 on Discord.`
                        );
                        break;
                }
            }

            const guild = await discord.guilds.cache.find((g) => g.id == guildID);
            const user = await guild.members.cache.find((u) => u.id == decoded.u);

            if (!user) {
                logger.warn(`Account Link (${message.user.username}):`, 'Failed to verify, Discord user left.');
                return message.user.sendMessage(
                    `${prefix} Couldn't verify account, the associated Discord account has left the server.`
                );
            }

            await AccountLink.create({ discord: user.id, osu: message.user.id });
            await user.setNickname(message.user.username);
            await user.roles.add('738629598270586920');
            if (message.user.country == 'CA') await user.roles.add('737836870687391814');
            if (message.user.pprank <= 5000) await user.roles.add('738541473414250506');
            logger.info(
                `Account Link (${message.user.username}):`,
                `Linked to Discord account ${user.user.tag} (${user.user.id}).`
            );
            await message.user.sendMessage(
                `${prefix} You have successfully linked this osu! account to Discord account ${user.user.tag}`
            );

            let embed = new MessageEmbed()
                .setTitle('Account Verified')
                .setColor('#88b300')
                .setDescription(`You have successfully verified yourself as osu! user **${message.user.username}**.`);

            await guild.channels.cache.find(c => c.id == '737836210759794690').send(`Welcome to osu!canada, ${user.user}.`);
            user.user.send(embed);
        });
    }
};
