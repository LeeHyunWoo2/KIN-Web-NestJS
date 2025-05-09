/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

import { logStructuredError } from '@/common/log-structured-error';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<FastifyRequest>();
    const res = ctx.getResponse<FastifyReply>();

    const err = exception instanceof Error ? exception : new Error('Unknown error');
    const status = exception instanceof HttpException ? exception.getStatus() : 500;

    logStructuredError(err, req);

    const response =
      exception instanceof HttpException
        ? exception.getResponse()
        : { code: 'INTERNAL_SERVER_ERROR', message: err.message || 'Unhandled error' };

    const errorResponse =
      typeof response === 'string'
        ? { code: 'SERVER_ERROR', message: response }
        : {
            code: response['code'] ?? 'SERVER_ERROR',
            message: response['message'] ?? 'Unexpected error',
            details: Object.keys(response).length > 2 ? response : undefined,
          };

    res.status(status).send(errorResponse);
  }
}
