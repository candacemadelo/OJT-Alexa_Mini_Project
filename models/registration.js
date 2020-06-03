var mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
	firstName: String,
	lastName: String,
	username: String,
	email: String,
	password: String
});

module.exports = mongoose.model("UserReg", userSchema);