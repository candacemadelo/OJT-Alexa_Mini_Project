var mongoose = require("mongoose");


var commandDevice = new mongoose.Schema({
	token : {type: String, required: true},
	power_status: {type: Number, required: true},
	temperature: {type: Number, required: true},
	mode: {type: String, required: true},
	endpointId: {type: String, required: true}
});


module.exports = mongoose.model("Commands", commandDevice);