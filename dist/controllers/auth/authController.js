"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renewTokenController = exports.logoutController = exports.loginController = exports.registerController = void 0;
const authService_1 = require("@/services/auth/authService");
const tokenService_1 = require("@/services/auth/tokenService");
const sendFormattedError_1 = require("@/utils/sendFormattedError");
const setCookie_1 = __importDefault(require("../../utils/setCookie"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const accessTokenMaxAge = Number(process.env.JWT_EXPIRATION) * 1000;
const registerController = async (req, res) => {
    try {
        const { username, email, password, name, marketingConsent } = req.body;
        await (0, authService_1.registerUser)({
            username,
            email,
            password,
            name,
            marketingConsent
        });
        res.status(201).json();
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "회원가입 중 오류가 발생했습니다.");
    }
};
exports.registerController = registerController;
// 로그인 (로컬 계정용)
const loginController = async (req, res) => {
    try {
        const { username, password, rememberMe } = req.body;
        const tokens = await (0, authService_1.loginUser)(username, password, rememberMe);
        (0, setCookie_1.default)(res, 'accessToken', tokens.accessToken, {
            maxAge: accessTokenMaxAge
        });
        (0, setCookie_1.default)(res, 'refreshToken', tokens.refreshToken, {
            maxAge: tokens.refreshTokenTTL * 1000
        });
        res.status(200).json({ success: true });
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "로그인 중 오류가 발생했습니다.");
    }
};
exports.loginController = loginController;
const logoutController = async (req, res) => {
    try {
        const { accessToken, refreshToken } = req.cookies;
        if (refreshToken) {
            const decoded = jsonwebtoken_1.default.decode(refreshToken);
            await (0, tokenService_1.deleteRefreshTokenFromRedis)(decoded.id);
        }
        if (accessToken) {
            await (0, tokenService_1.invalidateAccessToken)(accessToken);
        }
        res.clearCookie('accessToken', {
            httpOnly: true,
            domain: process.env.NODE_ENV === 'production' ? 'noteapp.org' : undefined
        });
        res.clearCookie('refreshToken', {
            httpOnly: true,
            domain: process.env.NODE_ENV === 'production' ? 'noteapp.org' : undefined
        });
        res.status(200).json();
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "로그아웃 중 오류가 발생했습니다.");
    }
};
exports.logoutController = logoutController;
const renewTokenController = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        const decodedData = await (0, tokenService_1.verifyRefreshToken)(refreshToken);
        const user = await (0, authService_1.getUserById)(decodedData.id);
        const tokens = await (0, tokenService_1.generateTokens)(user, decodedData.rememberMe, decodedData.ttl);
        (0, setCookie_1.default)(res, 'accessToken', tokens.accessToken, { maxAge: accessTokenMaxAge });
        (0, setCookie_1.default)(res, 'refreshToken', tokens.refreshToken, { maxAge: tokens.refreshTokenTTL * 1000 });
        res.status(200).json();
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "토큰 갱신 중 오류가 발생했습니다.");
    }
};
exports.renewTokenController = renewTokenController;
