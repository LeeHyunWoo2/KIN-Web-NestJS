"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const formatErrorResponse_1 = require("@/utils/formatErrorResponse"); // 기존 포맷팅 유틸 사용
const globalErrorHandler = (error, _req, res, _next) => {
    const status = error.status || 500;
    const message = error.message || 'Internal Server Error';
    res.status(status).json((0, formatErrorResponse_1.formatErrorResponse)(status, message));
};
exports.globalErrorHandler = globalErrorHandler;
