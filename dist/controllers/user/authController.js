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
Object.defineProperty(exports, "__esModule", { value: true });
exports.renewTokenController = exports.logoutController = exports.loginController = exports.registerController = void 0;
const authService = require('../../services/user/authService');
const tokenService = require('../../services/user/tokenService');
const { createErrorResponse } = require("../../utils/errorFormat");
const setCookie = require("../../utils/setCookie");
const jwt = require('jsonwebtoken');
const accessTokenMaxAge = Number(process.env.JWT_EXPIRATION) * 1000;
const registerController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, email, password, name, phone, marketingConsent } = req.body;
        const user = yield authService.registerUser({ id, email, password, name, phone, marketingConsent });
        res.status(201).json({ user });
    }
    catch (error) {
        const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "회원가입 중 오류가 발생했습니다.");
        res.status(statusCode).json({ message });
    }
});
exports.registerController = registerController;
// 로그인 (로컬 계정용)
const loginController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, password, rememberMe } = req.body;
        const { user, tokens } = yield authService.loginUser(id, password, rememberMe);
        setCookie(res, 'accessToken', tokens.accessToken, {
            maxAge: accessTokenMaxAge
        });
        setCookie(res, 'refreshToken', tokens.refreshToken, {
            maxAge: tokens.refreshTokenTTL * 1000
        });
        res.status(200).json({ user });
    }
    catch (error) {
        const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "로그인 중 오류가 발생했습니다.");
        res.status(statusCode).json({ message });
    }
});
exports.loginController = loginController;
const logoutController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { accessToken, refreshToken } = req.cookies;
        if (refreshToken) {
            const decoded = yield jwt.decode(refreshToken);
            yield tokenService.deleteRefreshTokenFromRedis(decoded.id);
        }
        if (accessToken) {
            yield tokenService.invalidateAccessToken(accessToken);
        }
        res.clearCookie('accessToken', { httpOnly: true, domain: process.env.NODE_ENV === 'production' ? 'noteapp.org' : undefined });
        res.clearCookie('refreshToken', { httpOnly: true, domain: process.env.NODE_ENV === 'production' ? 'noteapp.org' : undefined });
        res.status(200).json();
    }
    catch (error) {
        const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "로그아웃 중 오류가 발생했습니다.");
        res.status(statusCode).json({ message });
    }
});
exports.logoutController = logoutController;
const renewTokenController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = req.cookies;
        const decodedData = yield tokenService.verifyRefreshToken(refreshToken);
        const user = yield authService.getUserById(decodedData.id);
        const tokens = yield tokenService.generateTokens(user, decodedData.rememberMe, decodedData.ttl);
        setCookie(res, 'accessToken', tokens.accessToken, { maxAge: accessTokenMaxAge });
        setCookie(res, 'refreshToken', tokens.refreshToken, { maxAge: tokens.refreshTokenTTL * 1000 });
        res.status(200).json({ tokens });
    }
    catch (error) {
        const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "토큰 갱신 중 오류가 발생했습니다.");
        res.status(statusCode).json({ message });
    }
});
exports.renewTokenController = renewTokenController;
