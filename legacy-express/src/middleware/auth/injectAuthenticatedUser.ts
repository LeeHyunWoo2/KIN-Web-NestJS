import { verifyAccessToken } from '@/services/auth/tokenService';
import { Request, Response, NextFunction } from 'express';
import {DecodedUser} from "@/types/User";

// 검증된 토큰에서 추출한 유저 데이터를 req에 주입하는 미들웨어
export const injectAuthenticatedUser = async (
    req : Request,
    res : Response,
    next : NextFunction
): Promise<void> => {
  const skipInterceptor = req.headers['x-skip-interceptor'] === 'true' || 'false';
  const token = req.cookies?.accessToken;
  try {
    const decoded = await verifyAccessToken(token);
    req.user = decoded as DecodedUser;
    return next();
  } catch (error: any) {
    const errorCode = error?.code ?? 'UNKNOWN_ERROR';

    if (skipInterceptor) {
      req.user = undefined;
      return next();
    }

    // 분기별 로그 처리
    switch (errorCode) {
      case 'TOKEN_EXPIRED':
        console.info(`만료된 토큰 – ip: ${req.realIp}`);
        break;
      case 'TOKEN_BLACKLISTED':
        console.warn(`code: ${errorCode}, ip: ${req.realIp}`);
        break;
      case 'UNKNOWN_ERROR':
        console.warn(`${errorCode}, ip: ${req.realIp}`);
        break;
    }

    res.status(401).json({
      message: 'Access denied.',
      code: process.env.NODE_ENV !== 'production' ? errorCode : undefined,
    });
    return;
  }
};