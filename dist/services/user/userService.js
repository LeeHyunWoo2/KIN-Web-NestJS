"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserById = exports.addLocalAccount = exports.resetPassword = exports.updateUser = exports.getUserByQuery = exports.getUserById = exports.getUserPublicProfile = void 0;
const user_1 = __importDefault(require("../../models/user"));
const note_1 = __importDefault(require("../../models/note"));
const category_1 = __importDefault(require("../../models/category"));
const tag_1 = __importDefault(require("../../models/tag"));
// @ts-ignore
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const tokenService_1 = require("../auth/tokenService");
const socialService_1 = require("./socialService"); // 연동 해제를 위한 서비스 호출
const redis_1 = require("@/config/redis");
const createHttpError_1 = require("@/utils/createHttpError");
// 공개 프로필 데이터 조회
const getUserPublicProfile = async (userId) => {
    try {
        // 우선 Redis에서 조회
        const cachedProfile = await redis_1.redisClient.get(`publicProfile:${userId}`);
        if (cachedProfile) {
            return JSON.parse(cachedProfile);
        }
        // Redis에 없을 경우 DB에서 조회
        const user = await user_1.default.findById(userId).select('name email profileIcon role');
        if (!user) {
            throw new Error('사용자를 찾을 수 없습니다.');
        }
        const publicProfile = {
            name: user.name,
            email: user.email,
            profileIcon: user.profileIcon,
            userId: userId,
            role: user.role,
        };
        // Redis에 프로필 정보 저장
        await redis_1.redisClient.set(`publicProfile:${userId}`, JSON.stringify(publicProfile), 'EX', 3600);
        return publicProfile;
    }
    catch {
        throw (0, createHttpError_1.createHttpError)(400, "프로필 정보 처리 중 오류");
    }
};
exports.getUserPublicProfile = getUserPublicProfile;
// 사용자 정보 조회 (로그인된 유저의 DB ObjectId와 비밀번호 관련 제외 모든 정보)
const getUserById = async (userId) => {
    const user = await user_1.default.findById(userId).select('_id, -password, -passwordHistory, -deleteQueue');
    if (!user) {
        throw new Error;
    }
    return user;
};
exports.getUserById = getUserById;
// 이메일 중복확인 및 아이디 비번 찾기
const getUserByQuery = async (query) => {
    const { input, inputType } = query;
    let user;
    if (inputType === 'email') {
        user = await user_1.default.findOne({ email: input });
    }
    else if (inputType === 'id') {
        user = await user_1.default.findOne({ id: input });
    }
    else {
        throw new Error;
    }
    if (!user) {
        throw new Error;
    }
    return user;
};
exports.getUserByQuery = getUserByQuery;
// 사용자 정보 수정
const updateUser = async (userId, updateData) => {
    try {
        const user = await user_1.default.findById(userId);
        if (!user) {
            throw (0, createHttpError_1.createHttpError)(400, "유저를 찾을 수 없습니다.");
        }
        // 변경사항이 있는 항목은 db에 업데이트
        if (updateData.name) {
            user.name = updateData.name;
        }
        if (updateData.profileIcon) {
            user.profileIcon = updateData.profileIcon;
        }
        await user.save();
        const redisKey = `publicProfile:${userId}`;
        const ttl = await redis_1.redisClient.ttl(redisKey);
        const cachedProfile = await redis_1.redisClient.get(redisKey);
        let updatedProfile;
        if (cachedProfile) {
            const parsedProfile = JSON.parse(cachedProfile);
            updatedProfile = {
                ...parsedProfile,
                name: updateData.name || parsedProfile.name,
                profileIcon: updateData.profileIcon || parsedProfile.profileIcon,
            };
        }
        else {
            updatedProfile = {
                name: user.name,
                email: user.email,
                profileIcon: user.profileIcon,
            };
        }
        await redis_1.redisClient.set(redisKey, JSON.stringify(updatedProfile));
        if (ttl > 0) {
            await redis_1.redisClient.expire(redisKey, ttl);
        }
        return updatedProfile;
    }
    catch (error) {
        throw error;
    }
};
exports.updateUser = updateUser;
// ~일전 날짜 포맷팅 함수
const calculateDateDifference = (pastDate) => {
    const now = new Date();
    const diffInMs = now.getDate() - pastDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / (7));
    const diffInMonths = Math.floor(diffInWeeks / 4);
    if (diffInMonths > 0) {
        return diffInMonths + '개월 전';
    }
    else if (diffInWeeks > 0) {
        return diffInWeeks + '주 전';
    }
    else if (diffInDays > 0) {
        return diffInDays + '일 전';
    }
    else {
        return '최근';
    }
};
// 비밀번호 변경 (비밀번호 찾기)
const resetPassword = async (newPassword, email) => {
    const user = await user_1.default.findOne({ email });
    if (!user) {
        throw (0, createHttpError_1.createHttpError)(404, "유저를 찾을 수 없습니다.");
    }
    const isCurrentPassword = await bcryptjs_1.default.compare(newPassword, user.password);
    if (isCurrentPassword) {
        throw (0, createHttpError_1.createHttpError)(400, "현재 사용 중인 비밀번호와 다른 비밀번호를 입력해주세요.");
    }
    const duplicateRecord = user.passwordHistory
        .find((record) => bcryptjs_1.default.compareSync(newPassword, record.password));
    if (duplicateRecord) {
        const timeDifference = calculateDateDifference(duplicateRecord.changedAt);
        throw (0, createHttpError_1.createHttpError)(400, `${timeDifference}에 사용된 비밀번호입니다.`);
    }
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
    user.password = hashedPassword;
    // 비밀번호 기록에 추가 (최대 5개 기록 유지)
    if (user.passwordHistory.length >= 5) {
        user.passwordHistory.shift(); // 가장 오래된 기록 제거
    }
    user.passwordHistory.push({ password: hashedPassword, changedAt: new Date() });
    // 비밀번호 저장
    await user.save();
};
exports.resetPassword = resetPassword;
// 로컬 계정 추가 (소셜 Only 계정용)
const addLocalAccount = async (userId, username, email, password) => {
    const user = await user_1.default.findById(userId);
    if (!user) {
        throw new Error;
    }
    if (user.socialAccounts.some((account) => account.provider === 'local')) {
        throw (0, createHttpError_1.createHttpError)(400, "이미 로컬 계정이 등록되어 있습니다.");
    }
    user.id = username;
    user.email = email;
    user.password = await bcryptjs_1.default.hash(password, 10);
    user.socialAccounts.push({ provider: 'local', providerId: user });
    await user.save();
};
exports.addLocalAccount = addLocalAccount;
const deleteUserById = async (userId) => {
    const user = await user_1.default.findById(userId);
    if (!user) {
        throw new Error;
    }
    for (const account of user.socialAccounts) {
        if (account.provider !== 'local') {
            const accessToken = await (0, tokenService_1.generateOAuthToken)(user, account.provider);
            await (0, socialService_1.revokeSocialAccess)(account.provider, accessToken);
        }
    }
    await tag_1.default.deleteMany({ user_id: userId });
    await category_1.default.deleteMany({ user_id: userId });
    await note_1.default.deleteMany({ user_id: userId });
    await user_1.default.findByIdAndDelete(userId);
};
exports.deleteUserById = deleteUserById;
