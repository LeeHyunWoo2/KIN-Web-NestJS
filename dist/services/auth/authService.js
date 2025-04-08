"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = exports.loginUser = exports.registerUser = void 0;
// @ts-ignore
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_1 = __importDefault(require("../../models/user"));
const tokenService_1 = require("./tokenService");
const createHttpError_1 = require("@/utils/createHttpError");
// 회원가입 (로컬 계정)
const registerUser = async (data) => {
    const { username, email, password, name, marketingConsent } = data;
    const existingUser = await user_1.default.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        throw (0, createHttpError_1.createHttpError)(400, "이미 사용 중인 이메일 혹은 ID입니다.");
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const user = new user_1.default({
        username,
        email,
        password: hashedPassword,
        name,
        marketingConsent,
        socialAccounts: [
            {
                provider: 'local',
                providerId: username,
            },
        ],
        termsAgreed: true,
    });
    await user.save();
    return;
};
exports.registerUser = registerUser;
const loginUser = async (username, password, rememberMe) => {
    const user = await user_1.default.findOne({ username });
    const isPasswordValid = user ? await bcryptjs_1.default.compare(password, user.password) : false;
    if (!user || !isPasswordValid) {
        throw (0, createHttpError_1.createHttpError)(400, "ID 또는 비밀번호가 일치하지 않습니다.");
    }
    const tokens = await (0, tokenService_1.generateTokens)(user, rememberMe, null);
    return tokens;
};
exports.loginUser = loginUser;
// 사용자 정보 조회 (토큰 갱신용)
const getUserById = async (userId) => {
    const user = await user_1.default.findById(userId).select('-password');
    if (!user) {
        throw (0, createHttpError_1.createHttpError)(400, "유저 정보를 찾을 수 없습니다.");
    }
    return user;
};
exports.getUserById = getUserById;
