async function generateOtp() {
  const digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 4; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }

  const expireTime = Date.now() + 3 * 60 * 1000 ;

  return{
    OTP : OTP.toString(),
    otpExpire : expireTime
  }
}

module.exports = generateOtp;