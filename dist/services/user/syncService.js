"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserLastActivity = exports.updateUserActivityTime = void 0;
const user_1 = __importDefault(require("../../models/user"));
const updateUserActivityTime = async (userId, activityTime) => {
    try {
        await user_1.default.findByIdAndUpdate(userId, { lastActivity: activityTime }, { new: true });
    }
    catch {
        throw new Error;
    }
};
exports.updateUserActivityTime = updateUserActivityTime;
const getUserLastActivity = async (userId) => {
    try {
        const user = await user_1.default.findById(userId).select('lastActivity');
        return user.lastActivity;
    }
    catch {
        throw new Error;
    }
};
exports.getUserLastActivity = getUserLastActivity;
