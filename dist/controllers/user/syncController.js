"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncAllController = exports.getLastActivityController = exports.updateUserActivityTimeController = void 0;
const syncService_1 = require("@/services/user/syncService");
const noteService_1 = require("@/services/notes/noteService");
const categoryService_1 = require("@/services/notes/categoryService");
const tagService_1 = require("@/services/notes/tagService");
const sendFormattedError_1 = require("@/utils/sendFormattedError");
const updateUserActivityTimeController = async (req, res) => {
    const activityTime = req.body.currentTime;
    try {
        await (0, syncService_1.updateUserActivityTime)(req.user?.id, activityTime);
        res.status(200).json();
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "유저 활동 시간 갱신 중 오류가 발생했습니다.");
    }
};
exports.updateUserActivityTimeController = updateUserActivityTimeController;
const getLastActivityController = async (req, res) => {
    try {
        const lastActivity = await (0, syncService_1.getUserLastActivity)(req.user?.id);
        res.json({ lastActivity });
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "유저 마지막 활동 시간 조회 중 오류가 발생했습니다.");
    }
};
exports.getLastActivityController = getLastActivityController;
// 통합 데이터 반환
const syncAllController = async (req, res) => {
    try {
        const userId = req.user?.id;
        const [notes, categories, tags] = await Promise.all([
            (0, noteService_1.getNotes)(userId),
            (0, categoryService_1.getCategories)(userId),
            (0, tagService_1.getTags)(userId),
        ]);
        res.json({
            notes,
            categories,
            tags,
        });
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "데이터를 가져오는 중 오류가 발생했습니다.");
    }
};
exports.syncAllController = syncAllController;
