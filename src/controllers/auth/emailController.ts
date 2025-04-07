import {
  verifyEmailToken,
  sendVerificationEmail
} from '@/services/auth/emailService';
import {Request, Response} from 'express';
import {sendFormattedError} from "@/utils/sendFormattedError";
import {CustomError} from "@/types/CustomError";
import {EmailTokenRequestDto} from "@/types/dto/auth/auth.request.dto";

export const verifyEmailController = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.query;
  try {
    const email = await verifyEmailToken(token as string);
    res.status(200).send({ message: '이메일 인증이 완료되었습니다.', email });
  } catch (error) {
    sendFormattedError(res, error as CustomError, '이메일 인증 처리 중 서버 오류가 발생했습니다.');
  }
};

export const sendVerificationEmailController = async (
    req: Request<{},{},EmailTokenRequestDto>,
    res: Response
): Promise<void> => {
  const {email} = req.body;
  try {
    await sendVerificationEmail(email);
    res.status(200).send({message: '이메일 인증 링크가 전송되었습니다.'});
  } catch (error) {
    sendFormattedError(res, error as CustomError, "이메일 전송 실패")
  }
};