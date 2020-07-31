const { Sequelize, DataTypes } = require('sequelize');
const { dbauth } = require('./config.json');

const connection = new Sequelize(dbauth, {
	logging: false,
	dialectOptions: {
		timezone: 'America/Toronto'
	}
});

const AccountLink = connection.define('AccountLink', {
	discord: {
		type: DataTypes.STRING,
		allowNull: false
	},
	osu: {
		type: DataTypes.STRING,
		allowNull: false
	}
});

module.exports = {
	connection,
	AccountLink
};
