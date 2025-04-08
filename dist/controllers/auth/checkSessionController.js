"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAdminSessionAs404 = exports.checkSession = void 0;
const tokenService_1 = require("@/services/auth/tokenService");
const sendFormattedError_1 = require("@/utils/sendFormattedError");
const checkSession = async (req, res) => {
    try {
        const skipInterceptor = req.headers['x-skip-interceptor'] === 'true';
        const user = req.user;
        if (!user && skipInterceptor) {
            res.status(419).json({ message: '로그인이 필요한 페이지 입니다.' });
            return;
        }
        else if (!user) {
            res.status(401).json();
            return;
        }
        res.status(200).json({ user });
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "세션 확인 중 오류가 발생했습니다.");
    }
};
exports.checkSession = checkSession;
// 관리자 페이지 진입 시 세션 확인 함수
const checkAdminSessionAs404 = async (req, res) => {
    try {
        const { accessToken } = req.cookies;
        const decoded = await (0, tokenService_1.verifyAccessToken)(accessToken);
        if (decoded.role === 'admin') {
            res.status(200).json({ isAdmin: true });
            return;
        }
        else {
            res.status(404).json(); // 관리자 권한 아님
            return;
        }
    }
    catch {
        // 어떤 이유든 관리자 인증 실패 → 404
        res.status(404).json();
        return;
    }
};
exports.checkAdminSessionAs404 = checkAdminSessionAs404;
