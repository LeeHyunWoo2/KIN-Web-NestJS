import { ExecutionContext } from '@nestjs/common';

import { DecodedUser } from '@/auth/types/auth-service.types';
import { getCurrentUserFromContext } from '@/common/decorators/current-user.decorator';

describe('CurrentUserDecorator (getCurrentUserFromContext)', () => {
  it('FastifyRequest의 user 값을 반환해야 합니다', () => {
    const mockUser: DecodedUser = { id: 1, email: 'test@test.com', role: 'user' };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
    } as unknown as ExecutionContext;

    const result = getCurrentUserFromContext(mockContext);
    expect(result).toEqual(mockUser);
  });
});
