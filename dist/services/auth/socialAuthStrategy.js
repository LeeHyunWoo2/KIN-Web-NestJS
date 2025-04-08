"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureSocialStrategies = void 0;
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_kakao_1 = require("passport-kakao");
const passport_naver_1 = require("passport-naver");
const user_1 = __importDefault(require("@/models/user"));
// 소셜 로그인/가입 passport.js 인증 전략
const configureSocialStrategies = (passport) => {
    // Google 로그인/가입 전략
    passport.use(new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        passReqToCallback: true,
    }, async (_req, _accessToken, refreshToken, _params, profile, done) => {
        try {
            const providerId = profile.id;
            const existingUser = await user_1.default.findOne({
                'socialAccounts.provider': 'google',
                'socialAccounts.providerId': providerId,
            });
            if (existingUser) {
                // 로그인
                return done(null, existingUser);
            }
            // 회원가입
            const newUser = await user_1.default.create({
                name: profile.displayName,
                email: profile.emails?.[0]?.value,
                profileIcon: profile.photos?.[0]?.value,
                socialAccounts: [{
                        provider: 'google',
                        providerId,
                        socialRefreshToken: refreshToken,
                    }],
                termsAgreed: true,
            });
            return done(null, newUser);
        }
        catch (error) {
            return done(error, false);
        }
    }));
    // Kakao 로그인/가입 전략
    passport.use(new passport_kakao_1.Strategy({
        clientID: process.env.KAKAO_CLIENT_ID,
        clientSecret: process.env.KAKAO_CLIENT_SECRET,
        callbackURL: process.env.KAKAO_CALLBACK_URL,
        passReqToCallback: true,
    }, async (_req, _accessToken, refreshToken, profile, done) => {
        try {
            const providerId = profile.id;
            const existingUser = await user_1.default.findOne({
                'socialAccounts.provider': 'kakao',
                'socialAccounts.providerId': providerId,
            });
            if (existingUser) {
                return done(null, existingUser);
            }
            const newUser = await user_1.default.create({
                name: profile.displayName,
                email: profile._json?.kakao_account?.email,
                profileIcon: profile._json?.properties?.profile_image,
                socialAccounts: [{
                        provider: 'kakao',
                        providerId,
                        socialRefreshToken: refreshToken,
                    }],
                termsAgreed: true,
            });
            return done(null, newUser);
        }
        catch (error) {
            return done(error, false);
        }
    }));
    // Naver 로그인/가입 전략
    passport.use(new passport_naver_1.Strategy({
        clientID: process.env.NAVER_CLIENT_ID,
        clientSecret: process.env.NAVER_CLIENT_SECRET,
        callbackURL: process.env.NAVER_CALLBACK_URL,
        passReqToCallback: true,
    }, async (_req, _accessToken, refreshToken, profile, done) => {
        try {
            const providerId = profile.id;
            const existingUser = await user_1.default.findOne({
                'socialAccounts.provider': 'naver',
                'socialAccounts.providerId': providerId,
            });
            if (existingUser) {
                return done(null, existingUser);
            }
            const newUser = await user_1.default.create({
                name: profile.displayName,
                email: profile._json.email,
                profileIcon: profile._json.profile_image,
                socialAccounts: [{
                        provider: 'naver',
                        providerId,
                        socialRefreshToken: refreshToken,
                    }],
                termsAgreed: true,
            });
            return done(null, newUser);
        }
        catch (error) {
            return done(error, false);
        }
    }));
};
exports.configureSocialStrategies = configureSocialStrategies;
