var mongoose = require("mongoose");
var uniqueValidator = require('mongoose-unique-validator');
var bcrypt = require("bcryptjs");
const passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
	firstName: String,
	lastName: String,
	email: String,
	password: {
		type: String,
		required : true,
		minlength: 8
	}
});
 
//emails will be unique
userSchema.plugin(uniqueValidator);
userSchema.plugin(passportLocalMongoose);

//this function will be called before a document is saved
userSchema.pre('save', function(next) {
  let user = this;

  if (!user.isModified('password')) {
    return next();
  }

  //hash generator for passwords
  bcrypt
    .genSalt(12)
    .then((salt) => {
      return bcrypt.hash(user.password, salt);
    })
    .then((hash) => {
      user.password = hash;
      next();
    })
    .catch((err) => next(err));
});


module.exports = mongoose.model("User", userSchema);