"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNote = exports.updateNote = exports.createNote = exports.getNotes = void 0;
const note_1 = __importDefault(require("../../models/note"));
const getNotes = async (userId) => note_1.default.find({ user_id: userId }).sort({ created_at: -1 });
exports.getNotes = getNotes;
const createNote = async (userId, title, content, category, tags, mode) => {
    const note = new note_1.default({
        user_id: userId,
        title,
        content: Buffer.from(content),
        category,
        tags,
        mode,
    });
    return await note.save();
};
exports.createNote = createNote;
const updateNote = async (filter, updates) => {
    if (updates.content) {
        updates.content = Buffer.from(updates.content);
    }
    return note_1.default.findOneAndUpdate(filter, { ...updates, updated_at: Date.now() }, { new: true });
};
exports.updateNote = updateNote;
const deleteNote = async (noteId) => {
    note_1.default.findByIdAndDelete(noteId);
    return;
};
exports.deleteNote = deleteNote;
