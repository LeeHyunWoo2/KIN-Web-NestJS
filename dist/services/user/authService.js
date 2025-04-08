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
const bcrypt = require('bcryptjs');
const User = require('../../models/user');
const tokenService = require('./tokenService');
// 회원가입 (로컬 계정)
const registerUser = (_a) => __awaiter(void 0, [_a], void 0, function* ({ id, email, password, name, phone, marketingConsent }) {
    const existingUser = yield User.findOne({ $or: [{ email }, { id }] });
    if (existingUser) {
        const error = new Error("이미 사용 중인 이메일 혹은 ID입니다.");
        error.status = 400;
        throw error;
    }
    const hashedPassword = yield bcrypt.hash(password, 10);
    const user = new User({
        id,
        email,
        password: hashedPassword,
        name,
        phone,
        marketingConsent,
        socialAccounts: [
            {
                provider: 'local',
                providerId: id,
            },
        ],
        termsAgreed: true,
    });
    yield user.save();
    return user;
});
const loginUser = (id, password, rememberMe) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User.findOne({ id });
    const isPasswordValid = user ? yield bcrypt.compare(password, user.password) : false;
    if (!user || !isPasswordValid) {
        const error = new Error("ID 또는 비밀번호가 일치하지 않습니다.");
        error.status = 400;
        throw error;
    }
    const tokens = yield tokenService.generateTokens(user, rememberMe);
    return { user, tokens };
});
// 사용자 정보 조회 (토큰 갱신용)
const getUserById = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User.findById(userId).select('-password');
    if (!user) {
        throw new Error;
    }
    return user;
});
module.exports = {
    registerUser,
    loginUser,
    getUserById,
};
