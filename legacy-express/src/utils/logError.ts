import { Request } from 'express';

export const logError = (error: unknown, req: Request): void => {
  const err = error as Error;
  const logPayload = {
    type: 'server',
    message: err.message,
    stack: err.stack,
    status: (error as any).status || 500,
    path: req.originalUrl,
    method: req.method,
    user: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString(),
  };

  // 이후 filebeat가 수집할 수 있게 파일/로그로 출력
  console.error('[ERROR]', JSON.stringify(logPayload));
};