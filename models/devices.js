var mongoose = require("mongoose");
var uniqid   = require("uniqid");


var deviceSchema = new mongoose.Schema({
	userId : {type: String, required: true},
	tokenId: {type: String, required: true},
	endpointId: {type: String, required: true},
	description: {type: String, required: true},
	manufacturerName: {type: String, required: true},
	friendlyName: {type: String, required: true}
});


module.exports = mongoose.model("Devices", deviceSchema);