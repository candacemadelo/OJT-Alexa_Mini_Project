var mongoose        = require('mongoose'),
    uniqueValidator = require('mongoose-unique-validator'),
    crypto          = require('crypto');


 var sessionSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['valid', 'expired'],
    default: 'valid',
  },
  token: {
    type: String,
    required: true,
  },
  userInfo: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },

});
 
// generate a unique token
sessionSchema.statics.generateToken = function() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(16, (err, buf) => {
      if (err) {
        reject(err);
      }
      const token = buf.toString('hex');
      resolve(token);
    });
  });
};

//set the status of a token to expired
sessionSchema.methods.expireToken = function() {
  const session = this;
  return session.update({ $set: { status: 'expired' } });
};

module.exports = mongoose.model('Session', sessionSchema);