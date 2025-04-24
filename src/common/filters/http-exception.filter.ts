import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

import { logError } from '@/common/log-error';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<FastifyRequest>();
    const res = ctx.getResponse<FastifyReply>();

    const status = exception.getStatus();

    const message = exception.message;

    logError(exception, req);

    res.status(status);
    res.send({
      status,
      message,
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }
}
