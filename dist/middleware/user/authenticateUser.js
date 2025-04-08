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
const jwt = require('jsonwebtoken');
const redisClient = require('../../config/redis');
const cache = new Map();
// 유저 토큰 유효성 검사 및 유저 데이터 확인 미들웨어
const authenticateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.accessToken;
        const skipInterceptor = req.headers['x-skip-interceptor'] || false;
        if (!token) {
            if (skipInterceptor) {
                // x-skip-interceptor 헤더가 있으면 패스
                req.user = null;
                return next();
            }
            return res.status(401).json();
        }
        const isInvalidated = yield redisClient.get(`blacklist:${token}`);
        if (isInvalidated) {
            return res.status(401).json({ message: 'Access denied.' });
        }
        const cached = cache.get(token);
        if (cached && cached.expires > Date.now()) {
            req.user = cached.user;
            return next();
        }
        const user = jwt.verify(token, process.env.JWT_SECRET);
        cache.set(token, { user, expires: Date.now() + 1000 });
        req.user = user; // 요청 데이터에 유저 정보를 추가해서 넘김
        next();
    }
    catch (error) {
        const skipInterceptor = req.headers['x-skip-interceptor'] || false;
        if (skipInterceptor) {
            req.user = null;
            return next();
        }
        return res.status(401).json();
    }
});
// 주기적으로 캐시 정리
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (value.expires <= now) {
            cache.delete(key);
        }
    }
}, 5000);
module.exports = authenticateUser;
