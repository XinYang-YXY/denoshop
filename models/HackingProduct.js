const Sequelize = require("sequelize");
const db = require("../config/DBConfig");

const HackingProduct = db.define("hackingProduct", {
	price: {
		type: Sequelize.FLOAT,
	},
	imageFile: {
		type: Sequelize.STRING,
	},
	dateAdded: {
		type: Sequelize.DATE,
	},
	title: {
		type: Sequelize.STRING,
	},
	description: {
		type: Sequelize.STRING(2000),
	},
	category: {
		type: Sequelize.STRING,
	},
	quantity: {
		type: Sequelize.INTEGER,
	},
});

module.exports = HackingProduct;
