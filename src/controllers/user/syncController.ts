import { Request, Response } from "express";
import { updateUserActivityTime, getUserLastActivity } from '@/services/user/syncService';
import { getNotes } from "@/services/notes/noteService";
import { getCategories } from "@/services/notes/categoryService";
import { getTags } from "@/services/notes/tagService";
import {sendFormattedError} from "@/utils/sendFormattedError";
import {CustomError} from "@/types/CustomError";

export const updateUserActivityTimeController = async (
    req : Request<{}, {}, {currentTime: number}>,
    res : Response
): Promise<void> => {
  const activityTime = req.body.currentTime as number;

  try {
    await updateUserActivityTime(req.user?.id as string, activityTime);
    res.status(200).json();
  } catch (error) {
    sendFormattedError(res, error as CustomError, "유저 활동 시간 갱신 중 오류가 발생했습니다.");
  }
};

export const getLastActivityController = async (
    req : Request,
    res : Response
): Promise<void> => {
  try {
    const lastActivity = await getUserLastActivity(req.user?.id as string);
    res.json({ lastActivity });
  } catch (error) {
    sendFormattedError(res, error as CustomError, "유저 마지막 활동 시간 조회 중 오류가 발생했습니다.");
  }
};

// 통합 데이터 반환
export const syncAllController = async (
    req: Request,
    res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id as string;

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
    sendFormattedError(res, error as CustomError, "데이터를 가져오는 중 오류가 발생했습니다.");
  }
};