import {Router} from 'express';
import {sendVerificationEmailController, verifyEmailController} from '@/controllers/auth/emailController';

const emailRouter: Router = Router();

// 이메일 인증 확인
emailRouter.get('/', verifyEmailController);

// 이메일 인증 링크 전송
emailRouter.post('/', sendVerificationEmailController);

export {emailRouter};