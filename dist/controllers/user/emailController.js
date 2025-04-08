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
const emailService = require('../../services/user/emailService');
const { createErrorResponse } = require("../../utils/errorFormat");
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.query;
    try {
        const email = yield emailService.verifyEmailToken(token);
        res.status(200).send({ message: '이메일 인증이 완료되었습니다.', email });
    }
    catch (error) {
        res.status(400).send({ message: '인증 시간이 만료되었습니다.', error: error.message });
    }
});
const sendVerificationEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        yield emailService.sendVerificationEmail(email);
        res.status(200).send({ message: '이메일 인증 링크가 전송되었습니다.' });
    }
    catch (error) {
        const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "이메일 전송 실패");
        res.status(statusCode).json({ message });
    }
});
module.exports = {
    verifyEmail,
    sendVerificationEmail
};
