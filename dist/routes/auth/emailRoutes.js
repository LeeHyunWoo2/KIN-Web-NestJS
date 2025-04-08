"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailRouter = void 0;
const express_1 = require("express");
const emailController_1 = require("@/controllers/auth/emailController");
const emailRouter = (0, express_1.Router)();
exports.emailRouter = emailRouter;
// 이메일 인증 확인
emailRouter.get('/', emailController_1.verifyEmailController);
// 이메일 인증 링크 전송
emailRouter.post('/', emailController_1.sendVerificationEmailController);
