var mongoose = require("mongoose");
var uniqueValidator = require('mongoose-unique-validator');
var bcrypt = require("bcryptjs");
var passportLocalMongoose = require("passport-local-mongoose");
var validate = require('mongoose-validator');

//to chech if email syntax is valid
var validateEmail = function(email) {
    var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
};


//to check the limit of user input for names
var isLength = function(val) {
  return (val && 3 < val.length >- 35);
};

// var isNum = function(val) {
//   var numregex = /^[0-9]+$/;
//   return numregex.test(val);
// }

//user inputs for names must not include numbers
var onlyLettersAllow = function(string) {
    var myRegxp = /^[a-zA-Z]+$/i;
    return  myRegxp.test(string);
};

//validator for user
var  nameValidator = [
  // {validator: isNum, msg: 'Input must be String!.', httpStatus: 400},
  {validator: isLength, msg: 'Input is too short.', httpStatus: 400},
  {validator: onlyLettersAllow, msg: 'Letters allowed only.', httpStatus: 400}
];


//validator for email
var emailValidator = [
    {validator: validateEmail, msg: 'Please fill  valid email address.', httpStatus: 400},
];


//user schema plus model
var userSchema = new mongoose.Schema({
	firstName: {type: String, required: true, validate: nameValidator},
	lastName: {type: String, required: true, validate: nameValidator},
	email: {type: String, required: true, validate: emailValidator},
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