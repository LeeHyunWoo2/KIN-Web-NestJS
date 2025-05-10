import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { DecodedUser } from '@/auth/types/auth-service.types';

export const CurrentUserDecorator = createParamDecorator(
  (data: unknown, context: ExecutionContext): DecodedUser => {
    const request = context.switchToHttp().getRequest<{ user: DecodedUser }>();
    return request.user;
  },
);
