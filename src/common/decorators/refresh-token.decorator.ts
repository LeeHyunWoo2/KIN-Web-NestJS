import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

export const RefreshToken = createParamDecorator(
  (data: unknown, context: ExecutionContext): string | undefined => {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    return request.cookies?.refreshToken;
  },
);
