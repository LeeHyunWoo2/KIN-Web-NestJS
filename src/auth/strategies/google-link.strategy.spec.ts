import { getRepositoryToken } from '@mikro-orm/nestjs';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { GoogleLinkStrategy } from '@/auth/strategies/google-link.strategy';
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

const setupGoogleLinkStrategyTest = async (
  overrides: SetupOptions = {},
): Promise<{
  strategy: GoogleLinkStrategy;
  config: MockConfigService;
  userRepository: MockRepository<User>;
  socialAccountRepository: MockRepository<SocialAccount>;
}> => {
  const config = createMockConfigService({
    'oauth.google.clientId': 'google-client-id',
    'oauth.google.clientSecret': 'google-client-secret',
    'oauth.google.linkCallbackUrl': 'http://localhost:3000/auth/google-link/callback',
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
      GoogleLinkStrategy,
      { provide: ConfigService, useValue: config },
      { provide: getRepositoryToken(User), useValue: userRepository },
      { provide: getRepositoryToken(SocialAccount), useValue: socialAccountRepository },
    ],
  }).compile();

  return {
    strategy: moduleRef.get(GoogleLinkStrategy),
    config,
    userRepository,
    socialAccountRepository,
  };
};

describe('GoogleLinkStrategy', () => {
  describe('validate', () => {
    const baseAccessToken = 'access-token';
    const baseRefreshToken = 'refresh-token';

    it('req.user.id가 없으면 AccessTokenMissingException 을 던져야 합니다.', async () => {
      const { strategy } = await setupGoogleLinkStrategyTest();
      const req = { user: undefined } as any;

      const profile = { id: 'google-id' } as any;

      await expect(
        strategy.validate(req, baseAccessToken, baseRefreshToken, profile),
      ).rejects.toThrow(AccessTokenMissingException);
    });

    it('유저가 존재하지 않으면 UserNotFoundException 을 던져야 합니다.', async () => {
      const { strategy, userRepository } = await setupGoogleLinkStrategyTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(null),
        },
      });

      const req = { user: { id: 1 } } as any;
      const profile = { id: 'google-id' } as any;

      await expect(
        strategy.validate(req, baseAccessToken, baseRefreshToken, profile),
      ).rejects.toThrow(UserNotFoundException);

      expect(userRepository.findOne).toHaveBeenCalledWith(1);
    });

    it('이미 연동된 계정이면 AlreadyLinkedException 을 던져야 합니다.', async () => {
      const mockUser = { id: 1 };
      const existing = { providerId: 'google-id' };

      const { strategy } = await setupGoogleLinkStrategyTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(mockUser),
        },
        socialRepo: {
          findOne: jest.fn().mockResolvedValue(existing),
        },
      });

      const req = { user: { id: 1 } } as any;
      const profile = { id: 'google-id' } as any;

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

      const mockSocialAccount = { providerId: 'google-id' };
      const persistAndFlush = jest.fn();

      const { strategy, socialAccountRepository } = await setupGoogleLinkStrategyTest({
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
        id: 'google-id',
        provider: 'google',
        displayName: 'Test User',
        emails: [{ value: 'user@email.com' }],
        photos: [{ value: 'profile.png' }],
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
