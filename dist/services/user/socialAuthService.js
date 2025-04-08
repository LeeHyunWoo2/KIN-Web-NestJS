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
exports.configureSocialStrategies = void 0;
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_kakao_1 = require("passport-kakao");
const passport_naver_1 = require("passport-naver");
const user_1 = __importDefault(require("../../models/user"));
// 소셜 로그인/가입 passport.js 인증 전략
const configureSocialStrategies = (passport) => {
    // Google 로그인/가입 전략
    passport.use(new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        passReqToCallback: true,
    }, (req, accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            const providerId = profile.id;
            let user = yield user_1.default.findOne({
                'socialAccounts.provider': 'google',
                'socialAccounts.providerId': providerId,
            });
            if (!user) {
                user = new user_1.default({
                    name: profile.displayName,
                    email: (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value,
                    profileIcon: (_d = (_c = profile.photos) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value,
                    socialAccounts: [{
                            provider: 'google',
                            providerId,
                            socialRefreshToken: refreshToken,
                        }],
                    termsAgreed: true,
                });
                yield user.save();
                return done(null, user);
            }
            return done(null, user);
        }
        catch (error) {
            return done(error, false);
        }
    })));
    // Kakao 로그인/가입 전략
    passport.use(new passport_kakao_1.Strategy({
        clientID: process.env.KAKAO_CLIENT_ID,
        clientSecret: process.env.KAKAO_CLIENT_SECRET,
        callbackURL: process.env.KAKAO_CALLBACK_URL,
        passReqToCallback: true,
    }, (req, accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            const providerId = profile.id;
            let user = yield user_1.default.findOne({
                'socialAccounts.provider': 'kakao',
                'socialAccounts.providerId': providerId,
            });
            if (!user) {
                user = new user_1.default({
                    name: profile.displayName,
                    email: (_b = (_a = profile._json) === null || _a === void 0 ? void 0 : _a.kakao_account) === null || _b === void 0 ? void 0 : _b.email,
                    profileIcon: (_d = (_c = profile._json) === null || _c === void 0 ? void 0 : _c.properties) === null || _d === void 0 ? void 0 : _d.profile_image,
                    socialAccounts: [{
                            provider: 'kakao',
                            providerId,
                            socialRefreshToken: refreshToken,
                        }],
                    termsAgreed: true,
                });
                yield user.save();
                return done(null, user);
            }
            return done(null, user);
        }
        catch (error) {
            return done(error, false);
        }
    })));
    // Naver 로그인/가입 전략
    passport.use(new passport_naver_1.Strategy({
        clientID: process.env.NAVER_CLIENT_ID,
        clientSecret: process.env.NAVER_CLIENT_SECRET,
        callbackURL: process.env.NAVER_CALLBACK_URL,
        passReqToCallback: true,
    }, (req, accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const providerId = profile.id;
            let user = yield user_1.default.findOne({
                'socialAccounts.provider': 'naver',
                'socialAccounts.providerId': providerId,
            });
            if (!user) {
                user = new user_1.default({
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
                yield user.save();
                return done(null, user);
            }
            return done(null, user);
        }
        catch (error) {
            return done(error, false);
        }
    })));
};
exports.configureSocialStrategies = configureSocialStrategies;
