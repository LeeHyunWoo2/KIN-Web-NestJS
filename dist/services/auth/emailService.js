"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmailToken = exports.sendVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const tokenService_1 = require("./tokenService");
const createHttpError_1 = require("@/utils/createHttpError");
const sendVerificationEmail = async (email) => {
    const token = (0, tokenService_1.generateEmailVerificationToken)(email);
    const verificationLink = `${process.env.FRONTEND_ORIGIN}/verify-email?token=${token}`;
    const transporter = nodemailer_1.default.createTransport({
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
    await transporter.sendMail(mailOptions);
};
exports.sendVerificationEmail = sendVerificationEmail;
const verifyEmailToken = async (token) => {
    const { decoded } = (0, tokenService_1.verifyEmailVerificationToken)(token);
    if (!decoded) {
        throw (0, createHttpError_1.createHttpError)(400, '유효하지 않은 인증입니다.');
    }
    return decoded.email;
};
exports.verifyEmailToken = verifyEmailToken;
