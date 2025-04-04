import { Request, Response } from "express";
import syncService from '../../services/user/syncService';
import { createErrorResponse } from "../../utils/formatErrorResponse";
import { getNotes } from "../../services/notes/noteService";
import { getCategories } from "../../services/notes/categoryService";
import { getTags } from "../../services/notes/tagService";

export const updateUserActivityTimeController = async (req : Request, res : Response) => {
  const userId = req.user?.id;
  const activityTime = req.body.currentTime;

  try {
    const updatedUser = await syncService.updateUserActivityTime(userId, activityTime);
    res.json({lastActivity: updatedUser});
  } catch (error) {
    const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "유저 활동 시간 갱신 중 오류가 발생했습니다.");
    res.status(statusCode).json({ message });
  }
};

export const getLastActivityController = async (req : Request, res : Response) => {
  const userId = req.user?.id;

  try {
    const lastActivity = await syncService.getUserLastActivity(userId);
    res.json({ lastActivity });
  } catch (error) {
    const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "유저 마지막 활동 시간 조회 중 오류가 발생했습니다.");
    res.status(statusCode).json({ message });
  }
};

// 통합 데이터 반환
export const syncAllController = async (req, res) => {
  try {
    const userId = req.user.id;

    const [notes, categories, tags] = await Promise.all([
      getNotes(userId),
      getCategories(userId),
      getTags(userId),
    ]);

    res.json({
      notes,
      categories,
      tags,
    });
  } catch (error) {
    const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "데이터를 가져오는 중 오류가 발생했습니다.");
    res.status(statusCode).json({ message });
  }
};