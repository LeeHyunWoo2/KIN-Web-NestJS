"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureLinkingStrategies = void 0;
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_kakao_1 = require("passport-kakao");
const passport_naver_1 = require("passport-naver");
const user_1 = __importDefault(require("../../models/user"));
// 소셜 추가연동 passport.js 인증 전략
const configureLinkingStrategies = (passport) => {
    // Google 연동 전략
    passport.use('google-link', new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_LINK_CALLBACK_URL,
        passReqToCallback: true,
    }, async (req, _accessToken, refreshToken, profile, done) => {
        try {
            const providerId = profile.id;
            const user = await user_1.default.findById(req.user?.id);
            if (user) {
                user.socialAccounts.push({
                    provider: 'google',
                    providerId,
                    socialRefreshToken: refreshToken,
                });
                await user.save();
                return done(null, user);
            }
            return done(new Error);
        }
        catch (error) {
            console.error(error);
            return done(error, false);
        }
    }));
    // Kakao 연동 전략
    passport.use('kakao-link', new passport_kakao_1.Strategy({
        clientID: process.env.KAKAO_CLIENT_ID,
        clientSecret: process.env.KAKAO_CLIENT_SECRET,
        callbackURL: process.env.KAKAO_LINK_CALLBACK_URL,
        passReqToCallback: true,
    }, async (req, _accessToken, refreshToken, profile, done) => {
        try {
            const providerId = profile.id;
            const user = await user_1.default.findById(req.user?.id);
            if (user) {
                user.socialAccounts.push({
                    provider: 'kakao',
                    providerId,
                    socialRefreshToken: refreshToken,
                });
                await user.save();
                return done(null, user);
            }
            return done(new Error);
        }
        catch (error) {
            return done(error, false);
        }
    }));
    // Naver 연동 전략
    passport.use('naver-link', new passport_naver_1.Strategy({
        clientID: process.env.NAVER_CLIENT_ID,
        clientSecret: process.env.NAVER_CLIENT_SECRET,
        callbackURL: process.env.NAVER_LINK_CALLBACK_URL,
        passReqToCallback: true,
    }, async (req, _accessToken, refreshToken, profile, done) => {
        try {
            const providerId = profile.id;
            const user = await user_1.default.findById(req.user?.id);
            if (user) {
                user.socialAccounts.push({
                    provider: 'naver',
                    providerId,
                    socialRefreshToken: refreshToken,
                });
                await user.save();
                return done(null, user);
            }
            return done(new Error);
        }
        catch (error) {
            return done(error, false);
        }
    }));
};
exports.configureLinkingStrategies = configureLinkingStrategies;
