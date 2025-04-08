"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmailController = exports.verifyEmailController = void 0;
const emailService_1 = require("@/services/auth/emailService");
const sendFormattedError_1 = require("@/utils/sendFormattedError");
const verifyEmailController = async (req, res) => {
    const { token } = req.query;
    try {
        const email = await (0, emailService_1.verifyEmailToken)(token);
        res.status(200).send({ message: '이메일 인증이 완료되었습니다.', email });
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, '이메일 인증 처리 중 서버 오류가 발생했습니다.');
    }
};
exports.verifyEmailController = verifyEmailController;
const sendVerificationEmailController = async (req, res) => {
    const { email } = req.body;
    try {
        await (0, emailService_1.sendVerificationEmail)(email);
        res.status(200).send({ message: '이메일 인증 링크가 전송되었습니다.' });
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "이메일 전송 실패");
    }
};
exports.sendVerificationEmailController = sendVerificationEmailController;
