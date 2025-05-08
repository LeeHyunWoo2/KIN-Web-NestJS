import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { DecodedUser } from '@/types/user.types';

export const CurrentUserDecorator = createParamDecorator(
  (data: unknown, context: ExecutionContext): DecodedUser => {
    const request = context.switchToHttp().getRequest<{ user: DecodedUser }>();
    return request.user;
  },
);
