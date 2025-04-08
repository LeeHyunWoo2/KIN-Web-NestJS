"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategoriesWithNotes = exports.updateCategory = exports.createCategory = exports.getCategories = void 0;
const category_1 = __importDefault(require("../../models/category"));
const note_1 = __importDefault(require("../../models/note"));
const createHttpError_1 = require("@/utils/createHttpError");
const getCategories = async (userId) => category_1.default.find({ user_id: userId }).lean();
exports.getCategories = getCategories;
const createCategory = async (userId, name, parentId) => {
    if (parentId) {
        const parentCategory = await category_1.default.findOne({ _id: parentId, user_id: userId });
        if (!parentCategory) {
            throw (0, createHttpError_1.createHttpError)(400, '상위 카테고리를 찾을 수 없습니다.');
        }
    }
    const category = new category_1.default({ user_id: userId, name, parent_id: parentId });
    return await category.save();
};
exports.createCategory = createCategory;
const updateCategory = async (categoryId, name, parentId) => {
    const updatedCategory = await category_1.default.findByIdAndUpdate(categoryId, { name, parent_id: parentId }, { new: true });
    if (!updatedCategory) {
        throw (0, createHttpError_1.createHttpError)(404, '카테고리를 찾을 수 없습니다.');
    }
    return updatedCategory;
};
exports.updateCategory = updateCategory;
const deleteCategoriesWithNotes = async (categoryIds, noteIds) => {
    const existingCategories = await category_1.default.find({
        _id: { $in: categoryIds }
    });
    const existingNotes = await note_1.default.find({
        _id: { $in: noteIds }
    });
    const validCategoryIds = existingCategories.map(cat => cat._id.toString());
    const validNoteIds = existingNotes.map(note => note._id.toString());
    const invalidCategoryIds = categoryIds.filter(id => !validCategoryIds.includes(id));
    const invalidNoteIds = noteIds.filter(id => !validNoteIds.includes(id));
    if (invalidCategoryIds.length > 0 || invalidNoteIds.length > 0) {
        console.warn(`[카테고리 삭제] 잘못된 ID 감지 → 카테고리: ${invalidCategoryIds}, 노트: ${invalidNoteIds}`);
    }
    await category_1.default.deleteMany({ _id: { $in: validCategoryIds } });
    await note_1.default.deleteMany({ _id: { $in: validNoteIds } });
    return {
        deletedCategoryIds: validCategoryIds,
        deletedNoteIds: validNoteIds,
        invalidCategoryIds,
        invalidNoteIds
    };
};
exports.deleteCategoriesWithNotes = deleteCategoriesWithNotes;
