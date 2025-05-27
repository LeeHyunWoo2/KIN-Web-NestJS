import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { GoogleStrategy } from '@/auth/strategies/google.strategy';
import { MissingSocialEmailException } from '@/common/exceptions/auth.exceptions';
import { UserService } from '@/user/user.service';

import { createMockConfigService, MockConfigService } from '../../../test/utils/config.mock';

interface SetupOptions {
  config?: Record<string, string>;
  userService?: Partial<UserService>;
}

const setupGoogleStrategyTest = async (
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

describe('GoogleStrategy', () => {
  describe('validate', () => {
    const baseReq = {} as any;
    const baseAccessToken = 'access-token';
    const baseRefreshToken = 'refresh-token';

    it('이메일이 없으면 MissingSocialEmailException 을 던져야 합니다.', async () => {
      const profile = {
        id: 'google-id',
        emails: [],
      } as any;

      const { strategy } = await setupGoogleStrategyTest();

      await expect(
        strategy.validate(baseReq, baseAccessToken, baseRefreshToken, profile),
      ).rejects.toThrow(MissingSocialEmailException);
    });

    it('기존 유저가 있으면 findUserBySocialAccount 를 호출하고 결과를 반환해야 합니다.', async () => {
      const profile = {
        id: 'google-id',
        emails: [{ value: 'test@email.com' }],
      } as any;

      const existingUser = { id: 1, email: 'test@email.com', role: 'user' };

      const { strategy, userService } = await setupGoogleStrategyTest({
        userService: {
          findUserBySocialAccount: jest.fn().mockResolvedValue(existingUser),
        },
      });

      const result = await strategy.validate(baseReq, baseAccessToken, baseRefreshToken, profile);

      expect(userService.findUserBySocialAccount).toHaveBeenCalledWith('google', 'google-id');
      expect(result).toBe(existingUser);
    });

    it('기존 유저가 없으면 createSocialUser 를 호출해야 합니다.', async () => {
      const profile = {
        id: 'google-id',
        emails: [{ value: 'new@email.com' }],
        displayName: 'Tester',
        photos: [{ value: 'profile.png' }],
      } as any;

      const newUser = { id: 2, email: 'new@email.com', role: 'user' };

      const { strategy, userService } = await setupGoogleStrategyTest({
        userService: {
          findUserBySocialAccount: jest.fn().mockResolvedValue(undefined),
          createSocialUser: jest.fn().mockResolvedValue(newUser),
        },
      });

      const result = await strategy.validate(baseReq, baseAccessToken, baseRefreshToken, profile);

      expect(userService.createSocialUser).toHaveBeenCalledWith({
        provider: 'google',
        providerId: 'google-id',
        email: 'new@email.com',
        name: 'Tester',
        profileIcon: 'profile.png',
        socialRefreshToken: baseRefreshToken,
      });

      expect(result).toBe(newUser);
    });
  });
});
