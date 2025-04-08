"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategoryController = exports.updateCategoryController = exports.createCategoryController = exports.getCategoriesController = void 0;
const categoryService_1 = require("@/services/notes/categoryService");
const sendFormattedError_1 = require("@/utils/sendFormattedError");
const getCategoriesController = async (req, res) => {
    try {
        const categories = await (0, categoryService_1.getCategories)(req.user?.id);
        res.status(200).json(categories);
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "카테고리 조회 중 오류가 발생했습니다.");
    }
};
exports.getCategoriesController = getCategoriesController;
const createCategoryController = async (req, res) => {
    try {
        const { name, parent_id } = req.body;
        const category = await (0, categoryService_1.createCategory)(req.user?.id, name, parent_id);
        res.status(201).json(category);
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "카테고리 생성 중 오류가 발생했습니다.");
    }
};
exports.createCategoryController = createCategoryController;
const updateCategoryController = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name, parent_id } = req.body;
        const updatedCategory = await (0, categoryService_1.updateCategory)(categoryId, name, parent_id);
        res.status(200).json(updatedCategory);
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "카테고리 업데이트 중 오류가 발생했습니다.");
    }
};
exports.updateCategoryController = updateCategoryController;
const deleteCategoryController = async (req, res) => {
    try {
        const { categoryIds, noteIds } = req.body;
        const result = await (0, categoryService_1.deleteCategoriesWithNotes)(categoryIds, noteIds);
        res.status(200).json(result);
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, '카테고리 삭제 중 오류가 발생했습니다.');
    }
};
exports.deleteCategoryController = deleteCategoryController;
