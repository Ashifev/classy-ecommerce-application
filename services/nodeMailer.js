const { text } = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();

module.exports = {
    sendOtp :(OTP,Email)=>{
        console.log("nodemailer");
        const transporter = nodemailer.createTransport({
            service : "gmail",
            auth:{
                user : process.env.MY_EMAIL,
                pass : process.env.MY_PASSWORD,
            },
        });

        const mailDetails = {
            from : process.env.MY_EMAIL,
            to : Email,
            subject : "OTP",
            text : `<#> Your OTP from CLASSY to create an account with this e-mail is ${OTP}.Do not share it with anyone by any means.This is confidential and to be used for you only`
        };

        transporter.sendMail(mailDetails, (error, info)=>{
            if(error){
                console.log('error happened in nodemailer'+error);
            }else{
                console.log('Mail Sended');
            }
        })
    }
}