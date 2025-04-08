"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const authController_1 = require("@/controllers/auth/authController");
const checkSessionController_1 = require("@/controllers/auth/checkSessionController");
const injectAuthenticatedUser_1 = require("@/middleware/auth/injectAuthenticatedUser");
const validateTurnstile_1 = require("@/middleware/validateTurnstile");
const authRouter = (0, express_1.Router)();
exports.authRouter = authRouter;
authRouter.post('/register', validateTurnstile_1.validateTurnstile, authController_1.registerController);
authRouter.post('/login', validateTurnstile_1.validateTurnstile, authController_1.loginController);
authRouter.post('/logout', authController_1.logoutController);
// 세션 유효성 체크
authRouter.get('/session', injectAuthenticatedUser_1.injectAuthenticatedUser, checkSessionController_1.checkSession);
// 관리자 세션 유효성 체크(injectAuthenticatedUser) 는 따로 처리
authRouter.get('/admin-session', checkSessionController_1.checkAdminSessionAs404);
// Access Token 재발급
authRouter.post('/refresh', authController_1.renewTokenController);
