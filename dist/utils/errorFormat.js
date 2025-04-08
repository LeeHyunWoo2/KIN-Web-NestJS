"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorResponse = void 0;
// 오류 형식 지정
const createErrorResponse = (statusCode, message) => ({
    statusCode,
    message,
});
exports.createErrorResponse = createErrorResponse;
