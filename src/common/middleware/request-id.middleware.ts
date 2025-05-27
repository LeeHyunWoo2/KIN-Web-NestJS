import { randomUUID } from 'node:crypto';

import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: FastifyRequest, res: FastifyReply, next: () => void): void {
    req.requestId = (req.headers['x-request-id'] as string) ?? randomUUID();
    res.header('x-request-id', req.requestId);
    next();
  }
}
