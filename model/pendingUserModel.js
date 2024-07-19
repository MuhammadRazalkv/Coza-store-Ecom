const mongoose = require('mongoose');

const PendingUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  mobile: String,
  password: String,
  joinedDate: { type: Date, default: Date.now },
  otp: String,
  otpExpires: { type: Date, default: Date.now, index: { expires: '1m' } } // OTP expires in 1 minutes
});

const PendingUser = mongoose.model('PendingUser', PendingUserSchema);

 module.exports = PendingUser;