"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// 전역 쿠키 설정 함수
const setCookie = (res, name, val, options = {}) => {
    const defaultOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? 'noteapp.org' : undefined,
    };
    res.cookie(name, val, { ...defaultOptions, ...options });
};
exports.default = setCookie;
