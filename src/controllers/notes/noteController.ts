
import noteService from '../../services/notes/noteService';
import mongoose from "mongoose";
import { createErrorResponse } from "../../utils/formatErrorResponse";
const { ObjectId } = mongoose.Types;

export const getNotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const notes = await noteService.getNotes(userId);
    res.status(200).json(notes);
  } catch (error) {
    const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "노트를 불러오던 중 오류가 발생했습니다.");
    res.status(statusCode).json({ message });
  }
};

export const createNote = async (req, res) => {
  try {
    const { title, content, category, tags, mode } = req.body;
    const userId = new ObjectId(req.user.id);

    const note = await noteService.createNote(userId, title, content, category, tags, mode);
    res.status(201).json(note);
  } catch (error) {
    const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "노트 생성 중 오류가 발생했습니다.");
    res.status(statusCode).json({ message });
  }
};

export const updateNotes = async (req, res) => {
  try {
    const user_id = req.user.id;
    const updateDataList = req.body.updateDataList;

    if (!Array.isArray(updateDataList) || updateDataList.length === 0) {
      return res.status(400).json({ message: "업데이트할 데이터가 없습니다." });
    }

    const updatedNotes = await Promise.all(
        updateDataList.map((data) =>
            noteService.updateNote(
                { _id: data.id, user_id },
                { ...data }
            )
        )
    );
    res.status(200).json(updatedNotes.filter(Boolean));
  } catch (error) {
    const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "노트 수정 중 오류가 발생했습니다.");
    res.status(statusCode).json({ message });
  }
};

export const deleteNotes = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "삭제할 노트 ID가 없습니다." });
    }

    const deletedNotes = await Promise.all(
        ids.map((id) => noteService.deleteNote(id))
    );
    res.status(200).json(deletedNotes.filter(Boolean));
  } catch (error) {
    const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "노트 삭제 중 오류가 발생했습니다.");
    res.status(statusCode).json({ message });
  }
};