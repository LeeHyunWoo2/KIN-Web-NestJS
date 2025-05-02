import { getRepositoryToken } from '@mikro-orm/nestjs';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { NaverLinkStrategy } from '@/auth/strategies/naver-link.strategy';
import { SocialAccount } from '@/user/entity/social-account.entity';
import { User } from '@/user/entity/user.entity';

import { createMockConfigService, MockConfigService } from './config.mock';
import { createMockRepository, MockRepository } from './repository.mock';

interface SetupOptions {
  config?: Record<string, string>;
  userRepo?: Partial<MockRepository<User>>;
  socialRepo?: Partial<MockRepository<SocialAccount>>;
}

export const setupNaverLinkStrategyTest = async (
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
