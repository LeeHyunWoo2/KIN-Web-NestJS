"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeSocialAccess = exports.unlinkAccount = void 0;
const user_1 = __importDefault(require("../../models/user"));
const axios_1 = __importDefault(require("axios"));
const tokenService_1 = require("../auth/tokenService");
const createHttpError_1 = require("@/utils/createHttpError");
// 소셜 연동 해제
const unlinkAccount = async (userId, provider) => {
    try {
        const user = await user_1.default.findById(userId);
        if (!user) {
            throw (0, createHttpError_1.createHttpError)(404, "사용자를 찾을 수 없습니다.");
        }
        // '소셜 only 계정' 의 마지막 소셜 연동 해제 방지 (로컬도, 소셜도 아닌 계정이 생기는 것을 방지)
        const socialAccounts = user.socialAccounts.filter((acc) => acc.provider !== provider);
        const oauthToken = await (0, tokenService_1.generateOAuthToken)(user, provider);
        await (0, exports.revokeSocialAccess)(provider, oauthToken);
        user.socialAccounts = socialAccounts;
        await user.save();
        return;
    }
    catch (error) {
        throw error;
    }
};
exports.unlinkAccount = unlinkAccount;
// 플랫폼에게 연동 해제 요청
const revokeSocialAccess = async (provider, token) => {
    try {
        if (provider === 'google') {
            await axios_1.default.post(`https://oauth2.googleapis.com/revoke?token=${token}`);
        }
        else if (provider === 'kakao') {
            await axios_1.default.post('https://kapi.kakao.com/v1/user/unlink', null, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }
        else if (provider === 'naver') {
            await axios_1.default.post('https://nid.naver.com/oauth2.0/token', null, {
                params: {
                    grant_type: 'delete',
                    client_id: process.env.NAVER_CLIENT_ID,
                    client_secret: process.env.NAVER_CLIENT_SECRET,
                    access_token: token
                }
            });
        }
    }
    catch (error) {
        throw error;
    }
};
exports.revokeSocialAccess = revokeSocialAccess;
