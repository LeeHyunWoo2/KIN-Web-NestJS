"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unlinkSocialAccount = exports.handleSocialLinkCallback = exports.handleSocialCallback = void 0;
const tokenService_1 = require("@/services/auth/tokenService");
const setCookie_1 = __importDefault(require("@/utils/setCookie"));
const socialService_1 = require("@/services/user/socialService");
const sendFormattedError_1 = require("@/utils/sendFormattedError");
const accessTokenMaxAge = 60 * 60 * 1000; // 1시간
const handleSocialCallback = async (req, res) => {
    const { error, user } = req.authResult || {};
    if (error || !user) {
        if (typeof error === 'object' && error !== null && 'code' in error) {
            const err = error;
            if (err.code === 11000) {
                res.redirect(`${process.env.FRONTEND_ORIGIN}/login?error=${encodeURIComponent('해당 이메일로 가입된 일반계정이 있습니다.')}`);
                return;
            }
        }
        res.redirect(`${process.env.FRONTEND_ORIGIN}/login`);
        return;
    }
    try {
        const tokens = await (0, tokenService_1.generateTokens)(user, false, null);
        (0, setCookie_1.default)(res, 'accessToken', tokens.accessToken, {
            maxAge: accessTokenMaxAge,
            domain: process.env.NODE_ENV === 'production' ? 'noteapp.org' : undefined
        });
        (0, setCookie_1.default)(res, 'refreshToken', tokens.refreshToken, {
            maxAge: tokens.refreshTokenTTL * 1000,
            domain: process.env.NODE_ENV === 'production' ? 'noteapp.org' : undefined
        });
        res.redirect(`${process.env.FRONTEND_ORIGIN}/loginSuccess`);
    }
    catch {
        res.redirect(`${process.env.FRONTEND_ORIGIN}/login`);
    }
};
exports.handleSocialCallback = handleSocialCallback;
const handleSocialLinkCallback = (req, res) => {
    const { error } = req.authResult || {};
    if (error) {
        res.redirect(`${process.env.FRONTEND_ORIGIN}/userinfo?error=${encodeURIComponent('이미 연동된 계정입니다.')}`);
        return;
    }
    res.redirect(`${process.env.FRONTEND_ORIGIN}/userinfo`);
};
exports.handleSocialLinkCallback = handleSocialLinkCallback;
const unlinkSocialAccount = async (req, res) => {
    try {
        const { provider } = req.body;
        await (0, socialService_1.unlinkAccount)(req.user?.id, provider);
        res.status(200).json();
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "소셜 계정 연동 해제 중 오류가 발생했습니다.");
    }
};
exports.unlinkSocialAccount = unlinkSocialAccount;
