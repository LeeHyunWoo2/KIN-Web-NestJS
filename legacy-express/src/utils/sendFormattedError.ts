import { Response } from 'express';
import {CustomError, SendFormattedErrorOptions} from '@/types/CustomError';
import { formatErrorResponse } from './formatErrorResponse';

// 에러를 json 포맷하고 응답을 진행하는 헬퍼 함수 (컨트롤러 500에러 쪽)
export const sendFormattedError = (
    res: Response,
    error: CustomError,
    defaultMessage = 'Internal Server Error',
    options: SendFormattedErrorOptions = {}
): void => {
  const status = error.status || 500;
  const message = error.message || defaultMessage;
  const response = {
    ...formatErrorResponse(status, message),
    ...options,
  }
  res.status(status).json(response);
};
