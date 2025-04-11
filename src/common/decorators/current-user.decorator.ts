import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { DecodedUser } from '@/types/user.types';

export const CurrentUserDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): DecodedUser => {
    const request = ctx.switchToHttp().getRequest<{ user: DecodedUser }>();
    return request.user;
  },
);
