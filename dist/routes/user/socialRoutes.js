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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const passport = require('passport');
const { unlinkSocialAccount } = require('../../controllers/user/socialController');
const tokenService = require('../../services/user/tokenService');
const authenticateUser = require('../../middleware/user/authenticateUser');
const setCookie_1 = __importDefault(require("../../utils/setCookie"));
const router = express.Router();
const accessTokenMaxAge = parseInt(process.env.JWT_EXPIRATION, 10) * 1000;
const providers = {
    google: { scope: ['profile', 'email'], strategy: 'google-link' },
    kakao: { scope: ['profile_nickname', 'account_email', 'profile_image'], strategy: 'kakao-link' },
    naver: { scope: 'profile', strategy: 'naver-link' },
};
// 소셜 로그인 진입
router.get('/:provider', (req, res, next) => {
    const provider = req.params.provider;
    if (['google', 'kakao', 'naver'].includes(provider)) {
        passport.authenticate(provider, {
            scope: providers[provider].scope,
            accessType: 'offline', // 리프레시 토큰 발급 요청 (연동 해제할때 사용함)
            prompt: 'consent' // 매번 사용자 동의 요청
        })(req, res, next);
    }
    else {
        res.status(400).send();
    }
});
// 소셜 로그인 콜백
router.get('/:provider/callback', (req, res, next) => {
    const provider = req.params.provider;
    passport.authenticate(provider, { session: false }, (error, user) => __awaiter(void 0, void 0, void 0, function* () {
        if (error || !user) {
            if (error.code === 11000) {
                return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent("해당 이메일로 가입된 일반계정이 있습니다.")}`);
            }
            return res.redirect(`${process.env.FRONTEND_URL}/login`);
        }
        try {
            const tokens = yield tokenService.generateTokens(user);
            (0, setCookie_1.default)(res, 'accessToken', tokens.accessToken, {
                maxAge: accessTokenMaxAge,
                domain: process.env.NODE_ENV === 'production' ? 'noteapp.org' : undefined
            });
            (0, setCookie_1.default)(res, 'refreshToken', tokens.refreshToken, {
                maxAge: tokens.refreshTokenTTL * 1000,
                domain: process.env.NODE_ENV === 'production' ? 'noteapp.org' : undefined
            });
            return res.redirect(`${process.env.FRONTEND_URL}/loginSuccess`);
        }
        catch (error) {
            res.redirect(`${process.env.FRONTEND_URL}/login`);
        }
    }))(req, res, next);
});
// 일반 계정에 소셜 계정 추가 연동
router.get('/link/:provider', authenticateUser, (req, res, next) => {
    const provider = req.params.provider;
    if (['google', 'kakao', 'naver'].includes(provider)) {
        passport.authenticate(providers[provider].strategy, {
            scope: providers[provider].scope,
            accessType: 'offline',
            prompt: 'consent'
        })(req, res, next);
    }
    else {
        res.status(400).send();
    }
});
// 추가 연동 콜백
router.get('/link/:provider/callback', authenticateUser, (req, res, next) => {
    const provider = req.params.provider;
    passport.authenticate(providers[provider].strategy, { failureRedirect: '/userinfo' }, (error) => {
        if (error) {
            return res.redirect(`${process.env.FRONTEND_URL}/userinfo?error=${encodeURIComponent("이미 연동된 계정입니다.")}`);
        }
        res.redirect(`${process.env.FRONTEND_URL}/userinfo`);
    })(req, res, next);
});
// 소셜 계정 연동 해제
router.delete('/:provider', authenticateUser, unlinkSocialAccount);
module.exports = router;
