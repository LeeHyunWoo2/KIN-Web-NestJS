import rateLimit from 'express-rate-limit';
import { Request } from 'express';

export const globalLimiter = rateLimit({
  validate: {trustProxy: false},
  windowMs: 10 * 60 * 1000,
  max: 1500,
  message: "요청 횟수를 초과했습니다.",
});

export const apiLimiter = rateLimit({
  validate: {trustProxy: false},
  windowMs: 3 * 60 * 1000,
  max: 100,
  message: "요청 횟수를 초과 하였습니다. 잠시 후 다시 시도해주세요.",
  keyGenerator: (req : Request) : string =>
      typeof req.headers['cf-connecting-ip'] === 'string'
          ? req.headers['cf-connecting-ip']
          : req.ip || '',
});