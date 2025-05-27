import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { DecodedUser } from '@/auth/types/auth-service.types';
import { AccessTokenMissingException } from '@/common/exceptions';

export const getCurrentUserFromContext = (context: ExecutionContext): DecodedUser => {
  const request = context?.switchToHttp?.().getRequest<{ user?: DecodedUser }>();
  if (!request?.user) {
    throw new AccessTokenMissingException();
  }
  return request.user;
};

export const CurrentUserDecorator = createParamDecorator(getCurrentUserFromContext);
