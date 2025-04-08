"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTag = exports.updateTag = exports.getTags = exports.createTag = void 0;
const tag_1 = __importDefault(require("../../models/tag"));
const note_1 = __importDefault(require("../../models/note"));
const createHttpError_1 = require("@/utils/createHttpError");
const createTag = async (user_id, name) => await tag_1.default.create({ name, user_id });
exports.createTag = createTag;
const getTags = async (user_id) => tag_1.default.find({ user_id }).select('name').lean();
exports.getTags = getTags;
const updateTag = async (user_id, tagId, name) => {
    const updatedTag = await tag_1.default.findOneAndUpdate({ _id: tagId, user_id }, { name }, { new: true });
    if (!updatedTag) {
        (0, createHttpError_1.createHttpError)(404, '태그를 찾을 수 없습니다.');
    }
    return updatedTag;
};
exports.updateTag = updateTag;
const deleteTag = async (user_id, tagId, noteIds) => {
    const tag = await tag_1.default.findOneAndDelete({ _id: tagId, user_id });
    if (!tag) {
        throw (0, createHttpError_1.createHttpError)(404, '해당 태그를 찾을 수 없습니다.');
    }
    // 해당 태그가 사용된 노트에 반영
    if (noteIds && noteIds.length > 0) {
        await note_1.default.updateMany({ _id: { $in: noteIds }, user_id }, { $pull: { tags: { _id: tagId } } });
    }
    return { tagId, updatedNotes: noteIds || [] };
};
exports.deleteTag = deleteTag;
