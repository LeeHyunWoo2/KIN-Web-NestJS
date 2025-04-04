import { verifyAccessToken } from '@/services/auth/tokenService';
import { Request, Response, NextFunction } from 'express';

// 검증된 토큰에서 추출한 유저 데이터를 req에 주입하는 미들웨어
export const injectAuthenticatedUser = async (
    req : Request,
    res : Response,
    next : NextFunction
) => {
  const skipInterceptor = req.headers['x-skip-interceptor'] === 'true' || 'false';
  const token = req.cookies?.accessToken;
  try {
    const decoded = await verifyAccessToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    if (skipInterceptor) {
      req.user = null;
      return next();
    }

    switch (error.code) {
      case 'TOKEN_BLACKLISTED':
        return res.status(401).json({ message: 'Access denied.' });
      case 'TOKEN_INVALID':
        return res.status(401).json({ message: 'Access denied.' });
      case 'TOKEN_MISSING':
      default:
        return res.status(401).json({ message: 'Access denied.' });
    }
  }
};