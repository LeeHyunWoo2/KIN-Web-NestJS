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
    }, (req, accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const providerId = profile.id;
            const user = yield user_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
            if (user) {
                user.socialAccounts.push({
                    provider: 'google',
                    providerId,
                    socialRefreshToken: refreshToken,
                });
                yield user.save();
                return done(null, user);
            }
            return done(new Error);
        }
        catch (error) {
            console.error(error);
            return done(error, false);
        }
    })));
    // Kakao 연동 전략
    passport.use('kakao-link', new passport_kakao_1.Strategy({
        clientID: process.env.KAKAO_CLIENT_ID,
        clientSecret: process.env.KAKAO_CLIENT_SECRET,
        callbackURL: process.env.KAKAO_LINK_CALLBACK_URL,
        passReqToCallback: true,
    }, (req, accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const providerId = profile.id;
            const user = yield user_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
            if (user) {
                user.socialAccounts.push({
                    provider: 'kakao',
                    providerId,
                    socialRefreshToken: refreshToken,
                });
                yield user.save();
                return done(null, user);
            }
            return done(new Error);
        }
        catch (error) {
            return done(error, false);
        }
    })));
    // Naver 연동 전략
    passport.use('naver-link', new passport_naver_1.Strategy({
        clientID: process.env.NAVER_CLIENT_ID,
        clientSecret: process.env.NAVER_CLIENT_SECRET,
        callbackURL: process.env.NAVER_LINK_CALLBACK_URL,
        passReqToCallback: true,
    }, (req, accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const providerId = profile.id;
            const user = yield user_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
            if (user) {
                user.socialAccounts.push({
                    provider: 'naver',
                    providerId,
                    socialRefreshToken: refreshToken,
                });
                yield user.save();
                return done(null, user);
            }
            return done(new Error);
        }
        catch (error) {
            return done(error, false);
        }
    })));
};
exports.configureLinkingStrategies = configureLinkingStrategies;
