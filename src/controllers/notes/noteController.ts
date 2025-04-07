import { Request, Response } from 'express';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} from '@/services/notes/noteService';
import {sendFormattedError} from "@/utils/sendFormattedError";
import {CustomError} from "@/types/CustomError";

export const getNotesController = async (
    req: Request,
    res: Response,
): Promise<void> => {
  try {
    const notes = await getNotes(req.user?.id as string);
    res.status(200).json(notes);
  } catch (error) {
    sendFormattedError(res, error as CustomError, "노트를 불러오던 중 오류가 발생했습니다.");
  }
};

export const createNoteController = async (
    req: Request,
    res: Response,
): Promise<void> => {
  try {
    const { title, content, category, tags, mode } = req.body;

    const note = await createNote(req.user?.id as string, title, content, category, tags, mode);
    res.status(201).json(note);
  } catch (error) {
    sendFormattedError(res, error as CustomError, "노트 생성 중 오류가 발생했습니다.");
  }
};

export const updateNotesController = async (
    req: Request,
    res: Response,
): Promise<void> => {
  try {
    const user_id = req.user?.id as string;
    const updateDataList = req.body.updateDataList;

    if (!Array.isArray(updateDataList) || updateDataList.length === 0) {
      res.status(400).json({ message: "업데이트할 데이터가 없습니다." });
      return;
    }

    const updatedNotes = await Promise.all(
        updateDataList.map((data) =>
            updateNote(
                { _id: data.id, user_id },
                { ...data }
            )
        )
    );
    res.status(200).json(updatedNotes.filter(Boolean));
  } catch (error) {
    sendFormattedError(res, error as CustomError, "노트 수정 중 오류가 발생했습니다.");
  }
};

export const deleteNotesController = async (
    req: Request,
    res: Response,
): Promise<void> => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: "삭제할 노트 ID가 없습니다." });
    }

    const deletedNotes = await Promise.all(
        ids.map((id: string) => deleteNote(id))
    );
    res.status(200).json(deletedNotes.filter(Boolean));
  } catch (error) {
    sendFormattedError(res, error as CustomError, "노트 삭제 중 오류가 발생했습니다.");
  }
};