import { CustomError } from '@/types/CustomError';

// status + 메시지를 포함한 커스텀 HTTP 에러를 생성하는 함수
export const createHttpError = (status: number = 400, message: string): CustomError => {
  const error = new Error(message) as CustomError;
  error.status = status;
  return error;
}