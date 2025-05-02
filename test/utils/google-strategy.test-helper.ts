import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { GoogleStrategy } from '@/auth/strategies/google.strategy';
import { UserService } from '@/user/user.service';

import { createMockConfigService, MockConfigService } from './config.mock';

interface SetupOptions {
  config?: Record<string, string>;
  userService?: Partial<UserService>;
}

export const setupGoogleStrategyTest = async (
  overrides: SetupOptions = {},
): Promise<{
  strategy: GoogleStrategy;
  config: MockConfigService;
  userService: UserService;
}> => {
  const config = createMockConfigService({
    'oauth.google.clientId': 'google-client-id',
    'oauth.google.clientSecret': 'google-client-secret',
    'oauth.google.callbackUrl': 'http://localhost:3000/auth/google/callback',
    ...(overrides.config || {}),
  });

  const userService = {
    findUserBySocialAccount: jest.fn(),
    createSocialUser: jest.fn(),
    ...overrides.userService,
  } as unknown as UserService;

  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      GoogleStrategy,
      { provide: ConfigService, useValue: config },
      { provide: UserService, useValue: userService },
    ],
  }).compile();

  return {
    strategy: moduleRef.get(GoogleStrategy),
    config,
    userService,
  };
};
