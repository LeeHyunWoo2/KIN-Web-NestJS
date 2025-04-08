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
const axios = require('axios');
const redisClient = require('../../config/redis');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRATION, REFRESH_TOKEN_SECRET, REFRESH_EXPIRATION, REMEMBER_REFRESH_EXPIRATION, RENEW_REFRESH_TTL_LIMIT, REMEMBER_RENEW_REFRESH_TTL_LIMIT } = process.env;
// JWT 토큰 발급
const generateTokens = (user_1, ...args_1) => __awaiter(void 0, [user_1, ...args_1], void 0, function* (user, rememberMe = false, existingTTL = null) {
    let refreshTokenTTL;
    const accessTokenTTL = parseInt(JWT_EXPIRATION, 10);
    if (existingTTL) {
        // TTL값을 받았을경우엔 기존의 TTL유지
        refreshTokenTTL = existingTTL;
    }
    else {
        refreshTokenTTL = parseInt(rememberMe ? REMEMBER_REFRESH_EXPIRATION : REFRESH_EXPIRATION, 10);
    }
    const accessToken = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: accessTokenTTL });
    const refreshToken = jwt.sign({ id: user._id }, REFRESH_TOKEN_SECRET, { expiresIn: refreshTokenTTL });
    yield saveRefreshTokenToRedis(user._id, refreshToken, refreshTokenTTL, rememberMe);
    return { accessToken, refreshToken, refreshTokenTTL };
});
// JWT 검증
const verifyToken = (token, secret = JWT_SECRET) => {
    try {
        return jwt.verify(token, secret);
    }
    catch (error) {
        return null;
    }
};
// 리프레시 토큰 검증
const verifyRefreshToken = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        const userId = decoded.id;
        const storedTokenString = yield redisClient.get(`refreshToken:${userId}`);
        // 위아래 코드를 한줄로 한번에 작성하면 타입에러가 발생함
        const storedToken = JSON.parse(storedTokenString);
        if (!storedToken.token || storedToken.token !== refreshToken) {
            throw new Error('Access denied.');
        }
        let existingTokenTTL = yield redisClient.ttl(`refreshToken:${userId}`);
        if (existingTokenTTL < 0) {
            throw new Error('Access denied.');
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
        const decodedData = {
            id: userId,
            rememberMe: storedToken.rememberMe,
            ttl: existingTokenTTL,
        };
        return decodedData;
    }
    catch (error) {
        console.error(error.message);
        const customError = new Error('Access denied.');
        customError.status = 419;
        throw customError;
    }
});
// 소셜 연동 해제용 OAuth 토큰 발급
const generateOAuthToken = (user, provider) => __awaiter(void 0, void 0, void 0, function* () {
    const socialAccount = user.socialAccounts.find(account => account.provider === provider);
    if (!socialAccount) {
        throw new Error;
    }
    try {
        if (provider === 'google') {
            const response = yield axios.post('https://oauth2.googleapis.com/token', {
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                refresh_token: socialAccount.socialRefreshToken,
                grant_type: 'refresh_token',
            });
            return response.data.access_token;
        }
        else if (provider === 'kakao') {
            const response = yield axios.post('https://kauth.kakao.com/oauth/token', null, {
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
            const response = yield axios.post('https://nid.naver.com/oauth2.0/token', null, {
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
    catch (error) {
        console.log(error);
        throw new Error;
    }
});
// 메일 인증용 토큰
const generateEmailVerificationToken = (email) => jwt.sign({ email }, JWT_SECRET, { expiresIn: '10m' });
// 메일 인증용 토큰 검증
const verifyEmailVerificationToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (error) {
        console.log(error.message);
        return null;
    }
};
// Redis에 RefreshToken 저장
const saveRefreshTokenToRedis = (userId, refreshToken, ttl, rememberMe) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO : ${userId}:${deviceId} 이런식으로 기기정보도 함께 저장해서 다중로그인 구현하기
    try {
        yield redisClient.set(`refreshToken:${userId}`, JSON.stringify({ token: refreshToken, rememberMe: rememberMe }), 'EX', ttl);
    }
    catch (error) {
        console.error('Redis에 Refresh Token 저장 중 오류:', error.message);
        throw new Error('Redis 오류로 Refresh Token 저장 실패');
    }
});
// Redis에서 특정 RefreshToken 삭제
const deleteRefreshTokenFromRedis = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // 타이밍 문제로 지워지지 않는 경우가 생겨 나눠 작성
    yield redisClient.del(`refreshToken:${userId}`);
    yield redisClient.del(`publicProfile:${userId}`);
});
// 로그아웃한 AccessToken을 블랙리스트에 추가
const invalidateAccessToken = (accessToken) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = jwt.decode(accessToken);
    const ttl = Math.floor((decoded.exp * 1000 - Date.now()) / 1000);
    if (ttl > 0) {
        yield redisClient.set(`blacklist:${accessToken}`, true, 'EX', ttl);
    }
});
// 블랙리스트된 토큰인지 확인
const isAccessTokenInvalidated = (accessToken) => __awaiter(void 0, void 0, void 0, function* () {
    const isBlacklisted = yield redisClient.get(`blacklist:${accessToken}`);
    return !!isBlacklisted;
});
module.exports = {
    generateTokens,
    verifyToken,
    verifyRefreshToken,
    generateOAuthToken,
    generateEmailVerificationToken,
    verifyEmailVerificationToken,
    saveRefreshTokenToRedis,
    deleteRefreshTokenFromRedis,
    invalidateAccessToken,
    isAccessTokenInvalidated,
};
