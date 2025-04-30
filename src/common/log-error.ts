import { HttpException, LoggerService } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { LoggableError } from '@/common/types/loggable-error';

let logger: LoggerService;

export const setLogger = (loggerService: LoggerService): void => {
  logger = loggerService;
};

export const logError = (error: unknown, req: FastifyRequest): void => {
  if (!logger) {
    console.error('Logger 초기화 실패', error);
    return;
  }

  const err = error as LoggableError;
  if (err.__alreadyLogged) return;

  const status = error instanceof HttpException ? error.getStatus() : 500;
  const level = getLogLevel(status);

  const logPayload = {
    source: '💥 HttpExceptionFilter',
    type: 'server',
    status,
    message: err.message,
    stack: err.stack,
    path: req.url,
    method: req.method,
    user: (req as { user?: { id?: string } })?.user?.id || 'anonymous',
    timestamp: new Date().toISOString(),
  };
  logger[level](logPayload);
};

const getLogLevel = (statusCode: number): 'log' | 'warn' | 'error' => {
  if (statusCode >= 500) return 'error';
  if ([401, 403, 404].includes(statusCode)) return 'warn';
  return 'log';
};
