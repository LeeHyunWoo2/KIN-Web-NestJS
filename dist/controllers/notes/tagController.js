"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTagController = exports.updateTagController = exports.getTagsController = exports.createTagController = void 0;
const tagService_1 = require("@/services/notes/tagService");
const sendFormattedError_1 = require("@/utils/sendFormattedError");
const createTagController = async (req, res) => {
    try {
        const { name } = req.body;
        const tag = await (0, tagService_1.createTag)(req.user?.id, name);
        res.status(201).json(tag);
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "태그 생성 중 오류가 발생했습니다.");
    }
};
exports.createTagController = createTagController;
const getTagsController = async (req, res) => {
    try {
        const tags = await (0, tagService_1.getTags)(req.user?.id);
        res.status(200).json(tags);
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "태그 조회 중 오류가 발생했습니다.");
    }
};
exports.getTagsController = getTagsController;
const updateTagController = async (req, res) => {
    try {
        const { tagId } = req.params;
        const { name } = req.body;
        const updatedTag = await (0, tagService_1.updateTag)(req.user.id, tagId, name);
        res.status(200).json(updatedTag);
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "태그 수정 중 오류가 발생했습니다.");
    }
};
exports.updateTagController = updateTagController;
const deleteTagController = async (req, res) => {
    try {
        const { tagId } = req.params;
        const { noteIds } = req.body;
        const deletedTag = await (0, tagService_1.deleteTag)(req.user.id, tagId, noteIds);
        res.status(200).json(deletedTag);
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "태그 삭제 중 오류가 발생했습니다.");
    }
};
exports.deleteTagController = deleteTagController;
