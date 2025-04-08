"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatErrorResponse = void 0;
// 에러 응답 객체를 포맷하는 함수
const formatErrorResponse = (status, message, extras) => ({
    status,
    message,
    ...(extras || {}),
});
exports.formatErrorResponse = formatErrorResponse;
