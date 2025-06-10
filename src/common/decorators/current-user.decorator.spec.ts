import { ExecutionContext } from '@nestjs/common';

import { DecodedUser } from '@/auth/types/auth-service.types';
import { getCurrentUserFromContext } from '@/common/decorators/current-user.decorator';
import { AccessTokenMissingException } from '@/common/exceptions';

describe('getCurrentUserFromContext', () => {
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
  it('request.user 가 없을 경우 AccessTokenMissingException 을 던져야 합니다.', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    expect(() => getCurrentUserFromContext(mockContext)).toThrow(AccessTokenMissingException);
  });
});
