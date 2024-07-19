const nodemailer = require('nodemailer');

const mailSender = async (email,otp) => {
  try {
    let transporter = nodemailer.createTransport({
      service:"gmail",
      host: process.env.MAIL_HOST,
      port: 587, // Add port if necessary, usually 587 for TLS
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // SEND EMAIL TO USER
   const mailOptions = {
    from:process.env.MAIL_USER,
    to:email,
    subject:"otp verification",
    html:`<p>Your OTP code is <strong>${otp}</strong></p>`,

   }

   transporter.sendMail(mailOptions,function(error,info){
    if (error) {
      console.log(error.message);
    }else{
      console.log('mail has been send',info.response)
    }
   })

  //  console.log('Email info:', info);
   // return info;
  } catch (error) {
    console.error('Error while sending mails with nodemailer:', error); // Improved error logging
    throw error; // Rethrow the error to handle it outside the function if necessary
  }
};

module.exports = mailSender;
