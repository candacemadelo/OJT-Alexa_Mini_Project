var mongoose = require("mongoose");
var uniqid   = require("uniqid");

var deviceSchema = new mongoose.Schema({
	userId: {
	    type: mongoose.Schema.Types.ObjectId,
	    ref: "User"
	 }, 
	power_status: Number,
	temperature: Number,
	setpoints: Number,
	endpointId: String,
	description: String,
	manufacturerName: String, 
	friendlyName: String

});

module.exports = mongoose.model("Devices", deviceSchema);