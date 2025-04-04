import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

export const xssSanitizer = (req: Request, _res: Response, next: NextFunction): void => {
  (['body', 'query', 'params'] as const).forEach((key) => {
    if (req[key]) {
      for (const prop in req[key]) {
        if (typeof req[key][prop] === 'string') {
          req[key][prop] = xss(req[key][prop]);
        }
      }
    }
  });
  next();
}