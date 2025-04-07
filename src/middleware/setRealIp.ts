import { Request, Response, NextFunction } from 'express';

export const setRealIp = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
  const cfIp = req.headers['cf-connecting-ip'];
  req.realIp = typeof cfIp === 'string' ? cfIp : req.ip;
  next();
};