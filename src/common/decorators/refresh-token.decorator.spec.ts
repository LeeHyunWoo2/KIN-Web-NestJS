import { ExecutionContext } from '@nestjs/common';

import { getRefreshTokenFromContext } from '@/common/decorators/refresh-token.decorator';

describe('RefreshTokenDecorator (getRefreshTokenFromContext)', () => {
  it('FastifyRequest의 cookies.refreshToken 값을 반환해야 합니다', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          cookies: { refreshToken: 'test-refresh-token' },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = getRefreshTokenFromContext(mockContext);
    expect(result).toBe('test-refresh-token');
  });

  it('cookies.refreshToken이 없으면 undefined를 반환해야 합니다', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          cookies: {},
        }),
      }),
    } as unknown as ExecutionContext;

    const result = getRefreshTokenFromContext(mockContext);
    expect(result).toBeUndefined();
  });
});
