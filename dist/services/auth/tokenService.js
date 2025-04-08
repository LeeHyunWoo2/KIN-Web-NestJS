"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateAccessToken = exports.deleteRefreshTokenFromRedis = exports.saveRefreshTokenToRedis = exports.verifyEmailVerificationToken = exports.generateEmailVerificationToken = exports.generateOAuthToken = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateTokens = void 0;
const axios_1 = __importDefault(require("axios"));
const redis_1 = require("@/config/redis");
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const createHttpError_1 = require("@/utils/createHttpError");
const { JWT_SECRET, JWT_EXPIRATION, REFRESH_TOKEN_SECRET, } = process.env;
const REMEMBER_RENEW_REFRESH_TTL_LIMIT = parseInt(process.env.REMEMBER_RENEW_REFRESH_TTL_LIMIT, 10);
const REMEMBER_REFRESH_EXPIRATION = parseInt(process.env.REMEMBER_REFRESH_EXPIRATION, 10);
const RENEW_REFRESH_TTL_LIMIT = parseInt(process.env.RENEW_REFRESH_TTL_LIMIT, 10);
const REFRESH_EXPIRATION = parseInt(process.env.REFRESH_EXPIRATION, 10);
// JWT 토큰 발급
const generateTokens = async (user, rememberMe = false, existingTTL) => {
    const accessTokenTTL = parseInt(JWT_EXPIRATION, 10);
    let refreshTokenTTL;
    if (existingTTL) {
        // TTL값을 받았을경우엔 기존의 TTL유지
        refreshTokenTTL = existingTTL;
    }
    else {
        refreshTokenTTL = rememberMe ? REMEMBER_REFRESH_EXPIRATION : REFRESH_EXPIRATION;
    }
    const accessToken = jsonwebtoken_1.default.sign({
        id: user._id,
        email: user.email,
        role: user.role
    }, JWT_SECRET, { expiresIn: accessTokenTTL });
    const refreshToken = jsonwebtoken_1.default.sign({
        id: user._id
    }, REFRESH_TOKEN_SECRET, { expiresIn: refreshTokenTTL });
    await (0, exports.saveRefreshTokenToRedis)(user._id, refreshToken, refreshTokenTTL, rememberMe);
    return {
        accessToken,
        refreshToken,
        refreshTokenTTL
    };
};
exports.generateTokens = generateTokens;
// 액세스 토큰 검증
const verifyAccessToken = async (accessToken) => {
    if (!accessToken) {
        const err = new Error('Access Denied.');
        err.code = 'TOKEN_MISSING';
        throw err;
    }
    const isBlacklisted = await redis_1.redisClient.get(`blacklist:${accessToken}`);
    if (isBlacklisted) {
        const err = new Error('Access Denied.');
        err.code = 'TOKEN_BLACKLISTED';
        throw err;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(accessToken, JWT_SECRET, {
            algorithms: ['HS256'], // 알고리즘 고정
        });
        if (typeof decoded === 'string') {
            throw new Error('JwtPayload 타입에러');
        }
        return decoded;
    }
    catch (error) {
        const err = new Error('Access Denied.');
        if (error instanceof jsonwebtoken_1.TokenExpiredError) {
            err.code = 'TOKEN_EXPIRED';
        }
        else if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
            err.code = 'TOKEN_INVALID';
        }
        else {
            err.code = 'UNKNOWN_ERROR';
        }
        throw err;
    }
};
exports.verifyAccessToken = verifyAccessToken;
// 리프레시 토큰 검증
const verifyRefreshToken = async (refreshToken) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, REFRESH_TOKEN_SECRET);
        const userId = decoded.id;
        const storedTokenString = await redis_1.redisClient.get(`refreshToken:${userId}`);
        if (!storedTokenString) {
            throw (0, createHttpError_1.createHttpError)(419, "Access denied.");
        }
        // 한줄로 작성하면 결과가 string | null 인데, json.parse는 null을 처리하지 않기 때문에 타입을 좁힘
        const storedToken = JSON.parse(storedTokenString);
        if (!storedToken.token || storedToken.token !== refreshToken) {
            throw (0, createHttpError_1.createHttpError)(419, "Access denied.");
        }
        let existingTokenTTL = await redis_1.redisClient.ttl(`refreshToken:${userId}`);
        if (existingTokenTTL < 0) {
            throw (0, createHttpError_1.createHttpError)(419, "Access denied.");
            // 자동로그인 유저의 리프레시 토큰의 만료가 3일 미만일경우
        }
        else if (storedToken.rememberMe && existingTokenTTL
            < REMEMBER_RENEW_REFRESH_TTL_LIMIT) {
            existingTokenTTL = REMEMBER_REFRESH_EXPIRATION;
            // 일반 로그인 유저의 만료가 3시간 미만일경우
        }
        else if (!storedToken.rememberMe && existingTokenTTL
            < RENEW_REFRESH_TTL_LIMIT) {
            existingTokenTTL = REFRESH_EXPIRATION;
        }
        return {
            id: userId,
            rememberMe: storedToken.rememberMe,
            ttl: existingTokenTTL,
        };
    }
    catch {
        throw (0, createHttpError_1.createHttpError)(419, "Access denied.");
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
// 소셜 연동 해제용 OAuth 토큰 발급
const generateOAuthToken = async (user, provider) => {
    const socialAccount = user.socialAccounts.find(account => account.provider === provider);
    if (!socialAccount) {
        throw new Error;
    }
    try {
        if (provider === 'google') {
            const response = await axios_1.default.post('https://oauth2.googleapis.com/token', {
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                refresh_token: socialAccount.socialRefreshToken,
                grant_type: 'refresh_token',
            });
            return response.data.access_token;
        }
        else if (provider === 'kakao') {
            const response = await axios_1.default.post('https://kauth.kakao.com/oauth/token', null, {
                params: {
                    grant_type: 'refresh_token',
                    client_id: process.env.KAKAO_CLIENT_ID,
                    client_secret: process.env.KAKAO_CLIENT_SECRET,
                    refresh_token: socialAccount.socialRefreshToken,
                },
            });
            return response.data.access_token;
        }
        else if (provider === 'naver') {
            const response = await axios_1.default.post('https://nid.naver.com/oauth2.0/token', null, {
                params: {
                    grant_type: 'refresh_token',
                    client_id: process.env.NAVER_CLIENT_ID,
                    client_secret: process.env.NAVER_CLIENT_SECRET,
                    refresh_token: socialAccount.socialRefreshToken,
                },
            });
            return response.data.access_token;
        }
        else {
            throw new Error();
        }
    }
    catch {
        throw new Error;
    }
};
exports.generateOAuthToken = generateOAuthToken;
// 메일 인증용 토큰
const generateEmailVerificationToken = (email) => jsonwebtoken_1.default.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: '10m',
});
exports.generateEmailVerificationToken = generateEmailVerificationToken;
// 메일 인증용 토큰 검증
const verifyEmailVerificationToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        return decoded;
    }
    catch (error) {
        console.error('이메일 인증 토큰 검증 실패:', error.message);
        return null;
    }
};
exports.verifyEmailVerificationToken = verifyEmailVerificationToken;
// Redis에 RefreshToken 저장
const saveRefreshTokenToRedis = async (userId, refreshToken, ttl, rememberMe) => {
    try {
        await redis_1.redisClient.set(`refreshToken:${userId}`, JSON.stringify({ token: refreshToken, rememberMe }), 'EX', ttl);
    }
    catch (error) {
        console.error('Redis에 Refresh Token 저장 중 오류:', error.message);
        throw new Error('Redis 오류로 Refresh Token 저장 실패');
    }
};
exports.saveRefreshTokenToRedis = saveRefreshTokenToRedis;
// Redis에서 특정 RefreshToken 삭제
const deleteRefreshTokenFromRedis = async (userId) => {
    // 타이밍 문제로 지워지지 않는 경우가 생겨 나눠 작성
    await redis_1.redisClient.del(`refreshToken:${userId}`);
    await redis_1.redisClient.del(`publicProfile:${userId}`);
};
exports.deleteRefreshTokenFromRedis = deleteRefreshTokenFromRedis;
// 로그아웃한 AccessToken을 블랙리스트에 추가
const invalidateAccessToken = async (accessToken) => {
    const decoded = jsonwebtoken_1.default.decode(accessToken);
    if (!decoded) {
        console.error('exp 추출 실패');
        return;
    }
    const ttl = Math.floor((decoded.exp * 1000 - Date.now()) / 1000);
    if (ttl > 0) {
        await redis_1.redisClient.set(`blacklist:${accessToken}`, 'true', 'EX', ttl);
    }
};
exports.invalidateAccessToken = invalidateAccessToken;
