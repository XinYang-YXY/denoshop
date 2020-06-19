const Sequelize = require("sequelize");
const db = require("../config/DBConfig");

const User = db.define("user", {
	username: {
		type: Sequelize.STRING,
	},
	email: {
		type: Sequelize.STRING,
	},
	imageFile: {
		type: Sequelize.STRING,
		defaultValue: "default.jpg",
	},
	password: {
		type: Sequelize.STRING,
	},
	phoneNum: {
		type: Sequelize.INTEGER,
	},
	stripId: {
		type: Sequelize.STRING,
	},
	dateJoined: {
		type: Sequelize.DATE,
	}
});

module.exports = User;
