"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendFormattedError = void 0;
const formatErrorResponse_1 = require("./formatErrorResponse");
// 에러를 json 포맷하고 응답을 진행하는 헬퍼 함수 (컨트롤러 500에러 쪽)
const sendFormattedError = (res, error, defaultMessage = 'Internal jfgdhServer Error', options = {}) => {
    const status = error.status || 500;
    const message = error.message || defaultMessage;
    const response = {
        ...(0, formatErrorResponse_1.formatErrorResponse)(status, message),
        ...options,
    };
    res.status(status).json(response);
};
exports.sendFormattedError = sendFormattedError;
