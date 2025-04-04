import nodemailer from 'nodemailer';
import { generateEmailVerificationToken, verifyEmailVerificationToken } from './tokenService';
import {createHttpError} from "../../utils/createHttpError";
import {EmailTokenPayload} from "../../types/Auth";

export const sendVerificationEmail = async (email : string): Promise<void> => {
  const token = generateEmailVerificationToken(email);
  const verificationLink = `${process.env.FRONTEND_ORIGIN}/verify-email?token=${token}`;

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

  await transporter.sendMail(mailOptions);
};

export const verifyEmailToken = async (token: string): Promise<string> => {
  const {decoded} = verifyEmailVerificationToken(token) as EmailTokenPayload;

  if (!decoded) {
    throw createHttpError(400, '유효하지 않은 인증입니다.');
  }

  return decoded.email;
};