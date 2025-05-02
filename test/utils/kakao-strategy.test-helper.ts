import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { KakaoStrategy } from '@/auth/strategies/kakao.strategy';
import { UserService } from '@/user/user.service';

import { createMockConfigService, MockConfigService } from './config.mock';

interface SetupOptions {
  config?: Record<string, string>;
  userService?: Partial<UserService>;
}

export const setupKakaoStrategyTest = async (
  overrides: SetupOptions = {},
): Promise<{
  strategy: KakaoStrategy;
  config: MockConfigService;
  userService: UserService;
}> => {
  const config = createMockConfigService({
    'oauth.kakao.clientId': 'kakao-client-id',
    'oauth.kakao.clientSecret': 'kakao-client-secret',
    'oauth.kakao.callbackUrl': 'http://localhost:3000/auth/kakao/callback',
    ...(overrides.config || {}),
  });

  const userService = {
    findUserBySocialAccount: jest.fn(),
    createSocialUser: jest.fn(),
    ...overrides.userService,
  } as unknown as UserService;

  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      KakaoStrategy,
      { provide: ConfigService, useValue: config },
      { provide: UserService, useValue: userService },
    ],
  }).compile();

  return {
    strategy: moduleRef.get(KakaoStrategy),
    config,
    userService,
  };
};
