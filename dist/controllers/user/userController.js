"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserController = exports.addLocalAccountController = exports.resetPasswordController = exports.updateUserInfoController = exports.getUserByInputController = exports.getUserInfoController = exports.getUserPublicProfileController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const tokenService_1 = require("@/services/auth/tokenService");
const userService_1 = require("@/services/user/userService");
const createHttpError_1 = require("@/utils/createHttpError");
const sendFormattedError_1 = require("@/utils/sendFormattedError");
const getUserPublicProfileController = async (req, res) => {
    try {
        const publicProfile = await (0, userService_1.getUserPublicProfile)(req.user?.id);
        res.status(200).json(publicProfile);
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "프로필 조회 실패");
    }
};
exports.getUserPublicProfileController = getUserPublicProfileController;
const getUserInfoController = async (req, res) => {
    try {
        const user = await (0, userService_1.getUserById)(req.user?.id);
        res.status(200).json({ user });
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "사용자 정보 조회 중 오류가 발생했습니다.");
    }
};
exports.getUserInfoController = getUserInfoController;
//이메일 중복확인 및 아이디 비번 찾기
const getUserByInputController = async (req, res) => {
    try {
        const { input, inputType, fetchUserId } = req.body;
        const query = { input, inputType };
        const user = await (0, userService_1.getUserByQuery)(query);
        let checkAccountType;
        const hasLocalAccount = user.socialAccounts.some(account => account.provider === 'local');
        if (!hasLocalAccount) {
            checkAccountType = "SNS";
        }
        else {
            checkAccountType = "Local";
        }
        if (fetchUserId) {
            res.status(200).json({ signal: 'user_found', accountType: checkAccountType, id: user.username });
        }
        else {
            res.status(200).json({ signal: 'user_found', accountType: checkAccountType, email: user.email });
        }
    }
    catch {
        // 못 찾은게 서버측에서는 에러지만 로직상으로는 없는게 확인된것(성공)이기 때문에 200 코드와 플래그 반환
        res.status(200).json({ signal: 'user_not_found' });
    }
};
exports.getUserByInputController = getUserByInputController;
const updateUserInfoController = async (req, res) => {
    try {
        const userId = req.user?.id;
        // 테스트 계정 ID 배열
        const testAccountIds = ['672ae1ad9595d29f7bfbf34a', '672ae28b9595d29f7bfbf353'];
        if (testAccountIds.includes(userId)) {
            throw (0, createHttpError_1.createHttpError)(418, '테스트 계정은 변경할 수 없습니다.');
        }
        const { name, profileIcon } = req.body;
        const updatedUser = await (0, userService_1.updateUser)(userId, { name, profileIcon });
        res.status(200).json({ user: updatedUser });
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "사용자 정보 수정 중 오류가 발생했습니다.");
    }
};
exports.updateUserInfoController = updateUserInfoController;
// 비밀번호 변경
const resetPasswordController = async (req, res) => {
    try {
        const { newPassword, email } = req.body;
        await (0, userService_1.resetPassword)(newPassword, email);
        res.status(200).json({ message: "비밀번호가 성공적으로 변경되었습니다." });
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "비밀번호 변경 중 오류가 발생했습니다.");
    }
};
exports.resetPasswordController = resetPasswordController;
// 로컬 계정 추가 (소셜 Only 계정용)
const addLocalAccountController = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        await (0, userService_1.addLocalAccount)(req.user?.id, username, email, password);
        res.status(200).json();
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "로컬 계정 추가 중 오류가 발생했습니다.");
    }
};
exports.addLocalAccountController = addLocalAccountController;
const deleteUserController = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { accessToken, refreshToken } = req.cookies;
        if (refreshToken) {
            const decoded = jsonwebtoken_1.default.decode(refreshToken);
            await (0, tokenService_1.deleteRefreshTokenFromRedis)(decoded.id);
        }
        if (accessToken) {
            await (0, tokenService_1.invalidateAccessToken)(accessToken);
        }
        // 테스트 계정 ID 배열
        const testAccountIds = ['672ae1ad9595d29f7bfbf34a', '672ae28b9595d29f7bfbf353'];
        if (testAccountIds.includes(userId)) {
            throw (0, createHttpError_1.createHttpError)(418, '테스트 계정은 변경할 수 없습니다.');
        }
        await (0, userService_1.deleteUserById)(userId);
        res.clearCookie('accessToken', { httpOnly: true, domain: process.env.NODE_ENV === 'production' ? 'noteapp.org' : undefined });
        res.clearCookie('refreshToken', { httpOnly: true, domain: process.env.NODE_ENV === 'production' ? 'noteapp.org' : undefined });
        res.status(200).json();
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "회원 탈퇴 중 오류가 발생했습니다.");
    }
};
exports.deleteUserController = deleteUserController;
