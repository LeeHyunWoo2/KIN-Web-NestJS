"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../../controllers/user/authController");
const checkSessionController_1 = require("../../controllers/user/checkSessionController");
const authenticateUser_1 = __importDefault(require("../../middleware/user/authenticateUser"));
const validateTurnstile_1 = __importDefault(require("../../middleware/validateTurnstile"));
const router = (0, express_1.Router)();
router.post('/register', validateTurnstile_1.default, authController_1.registerController);
router.post('/login', validateTurnstile_1.default, authController_1.loginController);
router.post('/logout', authController_1.logoutController);
// 세션 유효성 체크
router.get('/session', authenticateUser_1.default, checkSessionController_1.checkSession);
// 관리자 세션 유효성 체크(authenticateUser) 는 따로 처리
router.get('/admin-session', checkSessionController_1.checkAdminSession);
// Access Token 재발급
router.post('/refresh', authController_1.renewTokenController);
exports.default = router;
