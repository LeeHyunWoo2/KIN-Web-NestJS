import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { NaverStrategy } from '@/auth/strategies/naver.strategy';
import { UserService } from '@/user/user.service';

import { createMockConfigService, MockConfigService } from './config.mock';

interface SetupOptions {
  config?: Record<string, string>;
  userService?: Partial<UserService>;
}

export const setupNaverStrategyTest = async (
  overrides: SetupOptions = {},
): Promise<{
  strategy: NaverStrategy;
  config: MockConfigService;
  userService: UserService;
}> => {
  const config = createMockConfigService({
    'oauth.naver.clientId': 'naver-client-id',
    'oauth.naver.clientSecret': 'naver-client-secret',
    'oauth.naver.callbackUrl': 'http://localhost:3000/auth/naver/callback',
    ...(overrides.config || {}),
  });

  const userService = {
    findUserBySocialAccount: jest.fn(),
    createSocialUser: jest.fn(),
    ...overrides.userService,
  } as unknown as UserService;

  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      NaverStrategy,
      { provide: ConfigService, useValue: config },
      { provide: UserService, useValue: userService },
    ],
  }).compile();

  return {
    strategy: moduleRef.get(NaverStrategy),
    config,
    userService,
  };
};
