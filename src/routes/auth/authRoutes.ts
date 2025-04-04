import {Router} from 'express';
import {
  registerController,
  loginController,
  logoutController,
  renewTokenController
} from '@/controllers/auth/authController';
import {checkSession, checkAdminSessionAs404} from '@/controllers/auth/checkSessionController';
import {injectAuthenticatedUser} from "@/middleware/auth/injectAuthenticatedUser";
import {validateTurnstile} from '@/middleware/validateTurnstile';

const authRouter: Router = Router();

authRouter.post('/register', validateTurnstile, registerController);

authRouter.post('/login', validateTurnstile, loginController);

authRouter.post('/logout', logoutController);

// 세션 유효성 체크
authRouter.get('/session', injectAuthenticatedUser, checkSession);

// 관리자 세션 유효성 체크(injectAuthenticatedUser) 는 따로 처리
authRouter.get('/admin-session', checkAdminSessionAs404);

// Access Token 재발급
authRouter.post('/refresh', renewTokenController)

export {authRouter};