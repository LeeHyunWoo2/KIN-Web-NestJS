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
const socialService = require('../../services/user/socialService');
const { createErrorResponse } = require("../../utils/errorFormat");
// 소셜 계정 연동 해제
const unlinkSocialAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { provider } = req.body;
        yield socialService.unlinkAccount(req.user.id, provider);
        res.status(200).json();
    }
    catch (error) {
        const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "소셜 계정 연동 해제 중 오류가 발생했습니다.");
        res.status(statusCode).json({ message });
    }
});
module.exports = {
    unlinkSocialAccount,
};
