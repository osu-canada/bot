const { BanchoClient } = require('bancho.js');
const creds = require('./config.json').bancho;

const client = new BanchoClient({
	username: creds.username,
	password: creds.password
});

client.connect().then(() => {
	console.log('Connected to Bancho!');
	client.on('PM', (message) => {
		if (message.user.ircUsername == creds.username) return;
		if (!message.message.startsWith(creds.prefix)) return;

		const args = message.message.slice(creds.prefix.length).split(/ +/);
		const command = args.shift().toLowerCase();

		console.log(`[${message.user.ircUsername}] ${message.message}`);

		switch (command) {
			case 'about':
				message.user.sendMessage(
					'This is the user account of Eton, the creator of the osu!canada community. This account is also used for account verification.'
				);
				break;
		}
	});
});
