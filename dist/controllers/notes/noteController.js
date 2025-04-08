"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotesController = exports.updateNotesController = exports.createNoteController = exports.getNotesController = void 0;
const noteService_1 = require("@/services/notes/noteService");
const sendFormattedError_1 = require("@/utils/sendFormattedError");
const getNotesController = async (req, res) => {
    try {
        const notes = await (0, noteService_1.getNotes)(req.user?.id);
        res.status(200).json(notes);
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "노트를 불러오던 중 오류가 발생했습니다.");
    }
};
exports.getNotesController = getNotesController;
const createNoteController = async (req, res) => {
    try {
        const { title, content, category, tags, mode } = req.body;
        const note = await (0, noteService_1.createNote)(req.user?.id, title, content, category, tags, mode);
        res.status(201).json(note);
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "노트 생성 중 오류가 발생했습니다.");
    }
};
exports.createNoteController = createNoteController;
const updateNotesController = async (req, res) => {
    try {
        const user_id = req.user?.id;
        const updateDataList = req.body.updateDataList;
        if (!Array.isArray(updateDataList) || updateDataList.length === 0) {
            res.status(400).json({ message: "업데이트할 데이터가 없습니다." });
            return;
        }
        const updatedNotes = await Promise.all(updateDataList.map((data) => (0, noteService_1.updateNote)({ _id: data.id, user_id }, { ...data })));
        res.status(200).json(updatedNotes.filter(Boolean));
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "노트 수정 중 오류가 발생했습니다.");
    }
};
exports.updateNotesController = updateNotesController;
const deleteNotesController = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ message: "삭제할 노트 ID가 없습니다." });
        }
        const deletedNotes = await Promise.all(ids.map((id) => (0, noteService_1.deleteNote)(id)));
        res.status(200).json(deletedNotes.filter(Boolean));
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "노트 삭제 중 오류가 발생했습니다.");
    }
};
exports.deleteNotesController = deleteNotesController;
