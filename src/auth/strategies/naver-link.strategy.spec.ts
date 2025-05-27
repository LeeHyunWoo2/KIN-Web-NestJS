import { getRepositoryToken } from '@mikro-orm/nestjs';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { NaverLinkStrategy } from '@/auth/strategies/naver-link.strategy';
import { AlreadyLinkedException } from '@/common/exceptions/auth.exceptions';
import { AccessTokenMissingException } from '@/common/exceptions/token.exceptions';
import { UserNotFoundException } from '@/common/exceptions/user.exceptions';
import { SocialAccount } from '@/user/entity/social-account.entity';
import { User } from '@/user/entity/user.entity';

import { createMockConfigService, MockConfigService } from '../../../test/utils/config.mock';
import { createMockRepository, MockRepository } from '../../../test/utils/repository.mock';

interface SetupOptions {
  config?: Record<string, string>;
  userRepo?: Partial<MockRepository<User>>;
  socialRepo?: Partial<MockRepository<SocialAccount>>;
}

const setupNaverLinkStrategyTest = async (
  overrides: SetupOptions = {},
): Promise<{
  strategy: NaverLinkStrategy;
  config: MockConfigService;
  userRepository: MockRepository<User>;
  socialAccountRepository: MockRepository<SocialAccount>;
}> => {
  const config = createMockConfigService({
    'oauth.naver.clientId': 'naver-client-id',
    'oauth.naver.clientSecret': 'naver-client-secret',
    'oauth.naver.linkCallbackUrl': 'http://localhost:3000/auth/naver-link/callback',
    ...(overrides.config || {}),
  });

  const userRepository = {
    ...createMockRepository<User>(),
    ...overrides.userRepo,
  };

  const socialAccountRepository = {
    ...createMockRepository<SocialAccount>(),
    ...overrides.socialRepo,
  };

  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      NaverLinkStrategy,
      { provide: ConfigService, useValue: config },
      { provide: getRepositoryToken(User), useValue: userRepository },
      { provide: getRepositoryToken(SocialAccount), useValue: socialAccountRepository },
    ],
  }).compile();

  return {
    strategy: moduleRef.get(NaverLinkStrategy),
    config,
    userRepository,
    socialAccountRepository,
  };
};

describe('NaverLinkStrategy', () => {
  describe('validate', () => {
    const baseAccessToken = 'access-token';
    const baseRefreshToken = 'refresh-token';

    it('req.user.id가 없으면 AccessTokenMissingException 을 던져야 합니다.', async () => {
      const { strategy } = await setupNaverLinkStrategyTest();
      const req = { user: undefined } as any;

      const profile = { id: 'naver-id' } as any;

      await expect(
        strategy.validate(req, baseAccessToken, baseRefreshToken, profile),
      ).rejects.toThrow(AccessTokenMissingException);
    });

    it('유저가 존재하지 않으면 UserNotFoundException 을 던져야 합니다.', async () => {
      const { strategy, userRepository } = await setupNaverLinkStrategyTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(null),
        },
      });

      const req = { user: { id: 1 } } as any;
      const profile = { id: 'naver-id' } as any;

      await expect(
        strategy.validate(req, baseAccessToken, baseRefreshToken, profile),
      ).rejects.toThrow(UserNotFoundException);

      expect(userRepository.findOne).toHaveBeenCalledWith(1);
    });

    it('이미 연동된 계정이면 AlreadyLinkedException 을 던져야 합니다.', async () => {
      const mockUser = { id: 1 };
      const existing = { providerId: 'naver-id' };

      const { strategy } = await setupNaverLinkStrategyTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(mockUser),
        },
        socialRepo: {
          findOne: jest.fn().mockResolvedValue(existing),
        },
      });

      const req = { user: { id: 1 } } as any;
      const profile = { id: 'naver-id' } as any;

      await expect(
        strategy.validate(req, baseAccessToken, baseRefreshToken, profile),
      ).rejects.toThrow(AlreadyLinkedException);
    });

    it('정상적으로 소셜 계정을 생성하고 AccessTokenPayload를 반환해야 합니다.', async () => {
      const mockUser = {
        id: 1,
        email: 'user@email.com',
        role: 'user',
      };

      const mockSocialAccount = { providerId: 'naver-id' };
      const persistAndFlush = jest.fn();

      const { strategy, socialAccountRepository } = await setupNaverLinkStrategyTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(mockUser),
        },
        socialRepo: {
          findOne: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockReturnValue(mockSocialAccount),
          getEntityManager: jest.fn().mockReturnValue({ persistAndFlush }),
        },
      });

      const req = { user: { id: 1 } } as any;
      const profile = {
        id: 'naver-id',
        provider: 'naver',
        displayName: 'Test User',
        _json: {
          email: 'user@email.com',
          profile_image: 'profile.png',
        },
      } as any;

      const result = await strategy.validate(req, baseAccessToken, baseRefreshToken, profile);

      expect(socialAccountRepository.create).toHaveBeenCalled();
      expect(persistAndFlush).toHaveBeenCalledWith(mockSocialAccount);
      expect(result).toEqual({
        id: 1,
        email: 'user@email.com',
        role: 'user',
      });
    });
  });
});
