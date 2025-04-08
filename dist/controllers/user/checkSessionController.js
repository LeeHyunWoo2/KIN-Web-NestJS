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
const tokenService = require('../../services/user/tokenService');
const redisClient = require('../../config/redis');
const { createErrorResponse } = require("../../utils/errorFormat");
const checkSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const skipInterceptor = req.headers['x-skip-interceptor'];
        const user = req.user;
        if (!user && skipInterceptor) {
            return res.status(419).json({ message: '로그인이 필요한 페이지 입니다.' });
        }
        else if (!user) {
            return res.status(401).json();
        }
        res.status(200).json({ user });
    }
    catch (error) {
        const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "세션 확인 중 오류가 발생했습니다.");
        res.status(statusCode).json({ message });
    }
});
const checkAdminSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { accessToken } = req.cookies;
        if (!accessToken) {
            return res.status(404).json();
        }
        const isInvalidated = yield redisClient.get(`blacklist:${accessToken}`);
        if (isInvalidated) {
            return res.status(404).json();
        }
        const decoded = yield tokenService.verifyToken(accessToken);
        if (!decoded) {
            return res.status(404).json();
        }
        if (decoded.role === 'admin') {
            return res.status(200).json({ isAdmin: true });
        }
        else {
            return res.status(404).json();
        }
    }
    catch (error) {
        // 의도적으로 404 출력
        res.status(404).json();
    }
});
module.exports = { checkSession, checkAdminSession };
