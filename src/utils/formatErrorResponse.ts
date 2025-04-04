export interface ErrorResponse {
  status : number;
  message : string;
  [key: string]: unknown;
}

// 에러 응답 객체를 포맷하는 함수
export const formatErrorResponse = (
    status : number = 500,
    message : string = 'Internal Server Error',
    extras? : Record<string, unknown>
) : ErrorResponse => ({
  status,
  message,
  ...(extras || {}),
});