import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

export const getRefreshTokenFromContext = (context: ExecutionContext): string | undefined => {
  const request = context.switchToHttp().getRequest<FastifyRequest>();
  return request.cookies?.refreshToken;
};

export const RefreshToken = createParamDecorator((_data: unknown, context: ExecutionContext) =>
  getRefreshTokenFromContext(context),
);
