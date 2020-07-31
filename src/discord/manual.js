module.exports = {
	name: 'manual',
	dmOnly: true,
	adminOnly: true,
	execute: async (message, args, { AccountLink }) => {
		if (!args) return;
		await AccountLink.create({ discord: args[0], osu: args[1] });
		message.reply('Done!');
	}
};
