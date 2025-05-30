import { ExecutionContext, HttpException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AccessGuard } from '@/auth/access.guard';
import { TokenService } from '@/auth/token.service';
import { AccessTokenPayload } from '@/auth/types/auth-service.types';
import { AccessTokenMissingException } from '@/common/exceptions';

describe('AccessGuard', () => {
  let guard: AccessGuard;
  let tokenService: jest.Mocked<TokenService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    tokenService = {
      verifyAccessToken: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;

    configService = {
      get: jest.fn().mockReturnValue('test'),
    } as unknown as jest.Mocked<ConfigService>;

    guard = new AccessGuard(tokenService, configService);
    jest.clearAllMocks();
  });

  const createMockContext = (accessToken?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          cookies: accessToken ? { accessToken } : {},
        }),
      }),
    }) as unknown as ExecutionContext;

  it('AccessToken이 없으면 AccessTokenMissingException을 던져야 합니다', async () => {
    await expect(guard.canActivate(createMockContext())).rejects.toThrow(
      AccessTokenMissingException,
    );
  });

  it('AccessToken이 있으면 verifyAccessToken을 호출하고 true를 반환해야 합니다', async () => {
    const mockUser: AccessTokenPayload = { id: 1, email: 'test@test.com', role: 'user' };
    tokenService.verifyAccessToken.mockResolvedValue(mockUser);

    const result = await guard.canActivate(createMockContext('valid-token'));

    expect(tokenService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
    expect(result).toBe(true);
  });

  it('verifyAccessToken에서 HttpException이 발생하면 그대로 전달해야 합니다', async () => {
    const httpError = new HttpException('Forbidden', 403);
    tokenService.verifyAccessToken.mockRejectedValue(httpError);

    await expect(guard.canActivate(createMockContext('token'))).rejects.toThrow(httpError);
  });

  it('verifyAccessToken에서 다른 에러가 발생하면 UnauthorizedException을 던져야 합니다', async () => {
    tokenService.verifyAccessToken.mockRejectedValue(new Error('Unexpected error'));

    await expect(guard.canActivate(createMockContext('token'))).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
