import { formatErrorResponse } from '@/utils/formatErrorResponse'; // 기존 포맷팅 유틸 사용
import { NextFunction, Request, Response } from 'express';
import { CustomError } from "@/types/CustomError";

export const globalErrorHandler = (
    error : CustomError,
    _req : Request,
    res : Response,
    _next : NextFunction
) : void => {
  const status = error.status || 500;
  const message = error.message || 'Internal Server Error';

  res.status(status).json(formatErrorResponse(status, message));
};