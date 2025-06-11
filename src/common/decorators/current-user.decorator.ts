import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { DecodedUser } from '@/auth/types/auth-service.types';
import { AccessTokenMissingException } from '@/common/exceptions';

export const getCurrentUserFromContext = (context: ExecutionContext): DecodedUser | undefined => {
  const request = context.switchToHttp().getRequest<FastifyRequest>();
  if (!request.user) {
    throw new AccessTokenMissingException();
  }
  return request.user;
};

export const CurrentUserDecorator = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => getCurrentUserFromContext(context),
);
