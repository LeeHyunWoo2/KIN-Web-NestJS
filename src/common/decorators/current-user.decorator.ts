import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { DecodedUser } from '@/auth/types/auth-service.types';

export const getCurrentUserFromContext = (context: ExecutionContext): DecodedUser => {
  const request = context.switchToHttp().getRequest<{ user: DecodedUser }>();
  return request.user;
};

export const CurrentUserDecorator = createParamDecorator(getCurrentUserFromContext);
