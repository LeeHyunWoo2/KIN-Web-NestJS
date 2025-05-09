import { HttpException, LoggerService } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

let logger: LoggerService;

export const setLogger = (loggerService: LoggerService): void => {
  logger = loggerService;
};

export const logStructuredError = (error: unknown, req: FastifyRequest): void => {
  const err = error instanceof Error ? error : new Error(String(error) || 'Unknown error');
  const status = error instanceof HttpException ? error.getStatus() : 500;
  const level = getLogLevel(status);

  logger[level]({
    source: 'HttpExceptionFilter',
    type: 'server',
    status,
    message: err.message,
    stack: err.stack,
    path: req.url,
    method: req.method,
    user: req.user?.id ?? 'anonymous',
    timestamp: new Date().toISOString(),
  });
};

const getLogLevel = (statusCode: number): 'log' | 'warn' | 'error' => {
  if (statusCode >= 500) return 'error';
  if ([401, 403, 404].includes(statusCode)) return 'warn';
  return 'log';
};
