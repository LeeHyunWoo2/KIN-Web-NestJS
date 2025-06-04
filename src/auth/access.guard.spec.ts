import { ExecutionContext, HttpException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { AccessGuard } from '@/auth/access.guard';
import { TokenService } from '@/auth/token.service';
import { AccessTokenPayload } from '@/auth/types/auth-service.types';
import { AccessTokenMissingException } from '@/common/exceptions';

import { createMockConfigService, MockConfigType } from '../../test/utils/config.mock';

interface SetupOptions {
  tokenService?: Partial<TokenService>;
  configService?: Partial<ConfigService>;
  config?: MockConfigType;
}

const setupAccessGuardTest = async (
  overrides: SetupOptions = {},
): Promise<{
  accessGuard: AccessGuard;
  tokenService: jest.Mocked<TokenService>;
  config: ConfigService;
}> => {
  const tokenService = {
    verifyAccessToken: jest.fn(),
    ...overrides.tokenService,
  } as unknown as jest.Mocked<TokenService>;

  const defaultConfig = {
    'app.nodeEnv': 'test',
  };
  const config = createMockConfigService({
    ...defaultConfig,
    ...(overrides.config || {}),
  });

  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      AccessGuard,
      { provide: TokenService, useValue: tokenService },
      { provide: ConfigService, useValue: config },
    ],
  }).compile();

  return {
    accessGuard: moduleRef.get(AccessGuard),
    tokenService,
    config: moduleRef.get(ConfigService),
  };
};

const createMockContext = (accessToken?: string) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        cookies: accessToken ? { accessToken } : {},
      }),
    }),
  }) as unknown as ExecutionContext;

describe('AccessGuard', () => {
  it('AccessToken이 없으면 AccessTokenMissingException을 던져야 합니다', async () => {
    const { accessGuard } = await setupAccessGuardTest();

    await expect(accessGuard.canActivate(createMockContext())).rejects.toThrow(
      AccessTokenMissingException,
    );
  });

  it('AccessToken이 있으면 verifyAccessToken을 호출하고 true를 반환해야 합니다', async () => {
    const mockUser: AccessTokenPayload = { id: 1, email: 'test@test.com', role: 'user' };
    const { accessGuard, tokenService } = await setupAccessGuardTest({
      tokenService: {
        verifyAccessToken: jest.fn().mockResolvedValue(mockUser),
      },
    });

    const result = await accessGuard.canActivate(createMockContext('valid-token'));

    expect(tokenService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
    expect(result).toBe(true);
  });

  it('verifyAccessToken에서 HttpException이 발생하면 그대로 전달해야 합니다', async () => {
    const httpError = new HttpException('Forbidden', 403);
    const { accessGuard } = await setupAccessGuardTest({
      tokenService: {
        verifyAccessToken: jest.fn().mockRejectedValue(httpError),
      },
    });

    await expect(accessGuard.canActivate(createMockContext('token'))).rejects.toThrow(httpError);
  });

  it('verifyAccessToken에서 다른 에러가 발생하면 UnauthorizedException을 던져야 합니다', async () => {
    const { accessGuard } = await setupAccessGuardTest({
      tokenService: {
        verifyAccessToken: jest.fn().mockRejectedValue(new Error('Unexpected error')),
      },
    });

    await expect(accessGuard.canActivate(createMockContext('token'))).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
