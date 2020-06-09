var mongoose = require("mongoose");
var uniqid   = require("uniqid");

var deviceSchema = new mongoose.Schema({
	userId: {
	    type: mongoose.Schema.Types.ObjectId,
	    ref: "User"
	 }, 
	power_status: {type: Number, required: true},
	temperature: {type: Number, required: true},
	setpoints: {type: Number, required: true},
	endpointId: {type: String, required: true},
	description: {type: String, required: true},
	manufacturerName: {type: String, required: true},
	friendlyName: {type: String, required: true}

});

module.exports = mongoose.model("Devices", deviceSchema);