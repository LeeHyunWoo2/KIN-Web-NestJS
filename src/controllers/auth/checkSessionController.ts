import { Request, Response} from 'express';
import { verifyAccessToken } from '@/services/auth/tokenService';
import {sendFormattedError} from "@/utils/sendFormattedError";
import {CustomError} from "@/types/CustomError";
import {logError} from "@/utils/logError";

export const checkSession = async (req : Request, res: Response) : Promise<void> => {
  try {
    const skipInterceptor = req.headers['x-skip-interceptor'] === 'true';
    const user = req.user;
    if (!user && skipInterceptor) {
      res.status(419).json({message: '로그인이 필요한 페이지 입니다.'});
      return;
    } else if (!user) {
      res.status(401).json();
      return;
    }
    res.status(200).json({ user });
  } catch (error) {
    logError(error, req);
    sendFormattedError(res, error as CustomError, "세션 확인 중 오류가 발생했습니다.")
  }
};

// 관리자 페이지 진입 시 세션 확인 함수
export const checkAdminSessionAs404 = async (req: Request, res: Response) : Promise<void> => {
  try {
    const { accessToken } = req.cookies;
    const decoded = await verifyAccessToken(accessToken);

    if (decoded.role === 'admin') {
      res.status(200).json({ isAdmin: true });
      return;
    } else {
      res.status(404).json(); // 관리자 권한 아님
      return;
    }
  } catch (error) {
    logError(error, req);
    // 어떤 이유든 관리자 인증 실패 → 404
    res.status(404).json();
    return;
  }
};