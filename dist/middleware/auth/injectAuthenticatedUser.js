"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectAuthenticatedUser = void 0;
const tokenService_1 = require("@/services/auth/tokenService");
// 검증된 토큰에서 추출한 유저 데이터를 req에 주입하는 미들웨어
const injectAuthenticatedUser = async (req, res, next) => {
    const skipInterceptor = req.headers['x-skip-interceptor'] === 'true' || 'false';
    const token = req.cookies?.accessToken;
    try {
        const decoded = await (0, tokenService_1.verifyAccessToken)(token);
        req.user = decoded;
        return next();
    }
    catch (error) {
        const errorCode = error?.code ?? 'UNKNOWN_ERROR';
        if (skipInterceptor) {
            req.user = undefined;
            return next();
        }
        // 분기별 로그 처리
        switch (errorCode) {
            case 'TOKEN_EXPIRED':
                console.info(`만료된 토큰 – ip: ${req.realIp}`);
                break;
            case 'TOKEN_BLACKLISTED':
                console.warn(`code: ${errorCode}, ip: ${req.realIp}`);
                break;
            case 'UNKNOWN_ERROR':
                console.warn(`${errorCode}, ip: ${req.realIp}`);
                break;
        }
        res.status(401).json({
            message: 'Access denied.',
            code: process.env.NODE_ENV !== 'production' ? errorCode : undefined,
        });
        return;
    }
};
exports.injectAuthenticatedUser = injectAuthenticatedUser;
