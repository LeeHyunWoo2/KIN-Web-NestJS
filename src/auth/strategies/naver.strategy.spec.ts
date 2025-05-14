import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { NaverStrategy } from '@/auth/strategies/naver.strategy';
import { UserService } from '@/user/user.service';

import { createMockConfigService, MockConfigService } from '../../../test/utils/config.mock';

interface SetupOptions {
  config?: Record<string, string>;
  userService?: Partial<UserService>;
}

const setupNaverStrategyTest = async (
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

describe('NaverStrategy', () => {
  describe('validate', () => {
    const baseReq = {} as any;
    const baseAccessToken = 'access-token';
    const baseRefreshToken = 'refresh-token';

    it('이메일이 없으면 InternalServerErrorException 을 던져야 합니다.', async () => {
      const profile = {
        id: 'naver-id',
        _json: {
          profile_image: 'profile.png',
        },
      } as any;

      const { strategy } = await setupNaverStrategyTest();

      await expect(
        strategy.validate(baseReq, baseAccessToken, baseRefreshToken, profile),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('기존 유저가 있으면 findUserBySocialAccount 를 호출하고 결과를 반환해야 합니다.', async () => {
      const profile = {
        id: 'naver-id',
        _json: {
          email: 'test@email.com',
          profile_image: 'profile.png',
        },
      } as any;

      const existingUser = { id: 1, email: 'test@email.com', role: 'user' };

      const { strategy, userService } = await setupNaverStrategyTest({
        userService: {
          findUserBySocialAccount: jest.fn().mockResolvedValue(existingUser),
        },
      });

      const result = await strategy.validate(baseReq, baseAccessToken, baseRefreshToken, profile);

      expect(userService.findUserBySocialAccount).toHaveBeenCalledWith('naver', 'naver-id');
      expect(result).toBe(existingUser);
    });

    it('기존 유저가 없으면 createSocialUser 를 호출해야 합니다.', async () => {
      const profile = {
        id: 'naver-id',
        displayName: 'Tester',
        _json: {
          email: 'new@email.com',
          profile_image: 'profile.png',
        },
      } as any;

      const newUser = { id: 2, email: 'new@email.com', role: 'user' };

      const { strategy, userService } = await setupNaverStrategyTest({
        userService: {
          findUserBySocialAccount: jest.fn().mockResolvedValue(undefined),
          createSocialUser: jest.fn().mockResolvedValue(newUser),
        },
      });

      const result = await strategy.validate(baseReq, baseAccessToken, baseRefreshToken, profile);

      expect(userService.createSocialUser).toHaveBeenCalledWith({
        provider: 'naver',
        providerId: 'naver-id',
        email: 'new@email.com',
        name: 'Tester',
        profileIcon: 'profile.png',
        socialRefreshToken: baseRefreshToken,
      });

      expect(result).toBe(newUser);
    });
  });
});
