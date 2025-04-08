"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpError = void 0;
// status + 메시지를 포함한 커스텀 HTTP 에러를 생성하는 함수
const createHttpError = (status = 400, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
};
exports.createHttpError = createHttpError;
