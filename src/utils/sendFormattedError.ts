import { Response } from 'express';
import { CustomError } from '@/types/CustomError';
import { formatErrorResponse } from './formatErrorResponse';

// 에러를 json 포맷하고 응답을 진행하는 헬퍼 함수
export const sendFormattedError = (
    res: Response,
    error: CustomError,
    defaultMessage = 'Internal Server Error'
): void => {
  const status = error.status || 500;
  const message = error.message || defaultMessage;
  const response = formatErrorResponse(status, message);
  res.status(status).json(response);
};
