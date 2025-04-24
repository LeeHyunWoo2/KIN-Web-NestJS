import { HttpException } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

export const logError = (error: unknown, req: FastifyRequest): void => {
  const err = error as Error;
  const status = error instanceof HttpException ? error.getStatus() : 500;

  const level = getLogLevel(status);

  const logPayload = {
    type: 'server',
    status,
    message: err.message,
    stack: err.stack,
    path: req.url,
    method: req.method,
    user: (req as { user?: { id?: string } })?.user?.id || 'anonymous',
    timestamp: new Date().toISOString(),
  };
  console[level](`[${level.toUpperCase()}]`, JSON.stringify(logPayload));
};

const getLogLevel = (statusCode: number): 'log' | 'warn' | 'error' => {
  if (statusCode >= 500) return 'error';
  if ([401, 403, 404].includes(statusCode)) return 'warn';
  return 'log';
};
