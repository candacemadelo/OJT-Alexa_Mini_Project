var mongoose = require("mongoose");

var deviceSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	}, 
	power_status: Number,
	temperature: Number,
	setpoints: Number,
	mode: String,
	endpointId: String,
	description: String,
	manufacturerName: String, 
	friendlyName: String

});

module.exports = mongoose.model("Devices", deviceSchema);