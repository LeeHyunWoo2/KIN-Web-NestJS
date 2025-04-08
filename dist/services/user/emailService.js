"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const nodemailer = require('nodemailer');
const { generateEmailVerificationToken, verifyEmailVerificationToken } = require('./tokenService');
const sendVerificationEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const token = generateEmailVerificationToken(email);
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '이메일 인증 요청',
        text: `
    Keep Idea Note 에서 인증 요청을 하셨나요?
    
    본인의 인증 요청이 맞다면 다음 링크를 클릭하여 이메일 인증을 완료하실 수 있습니다.
     
     ${verificationLink}`,
    };
    yield transporter.sendMail(mailOptions);
});
const verifyEmailToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const decoded = verifyEmailVerificationToken(token);
        if (!decoded) {
            throw new Error('유효하지 않은 인증입니다.');
        }
        return decoded.email;
    }
    catch (error) {
        throw new Error(error.message);
    }
});
module.exports = {
    sendVerificationEmail,
    verifyEmailToken
};
