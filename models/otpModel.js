const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email :{
        type : String,
        unique : true
    },
    OTP : {
        type : String,
        require :true,
    },
    otpExpire : {
        type : Number,
        require : true
    }
});

const otp = mongoose.model('OTP',otpSchema);
module.exports = otp;