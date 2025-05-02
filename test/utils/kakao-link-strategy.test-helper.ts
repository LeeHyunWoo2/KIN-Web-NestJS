import { getRepositoryToken } from '@mikro-orm/nestjs';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { KakaoLinkStrategy } from '@/auth/strategies/kakao-link.strategy';
import { SocialAccount } from '@/user/entity/social-account.entity';
import { User } from '@/user/entity/user.entity';

import { createMockConfigService, MockConfigService } from './config.mock';
import { createMockRepository, MockRepository } from './repository.mock';

interface SetupOptions {
  config?: Record<string, string>;
  userRepo?: Partial<MockRepository<User>>;
  socialRepo?: Partial<MockRepository<SocialAccount>>;
}

export const setupKakaoLinkStrategyTest = async (
  overrides: SetupOptions = {},
): Promise<{
  strategy: KakaoLinkStrategy;
  config: MockConfigService;
  userRepository: MockRepository<User>;
  socialAccountRepository: MockRepository<SocialAccount>;
}> => {
  const config = createMockConfigService({
    'oauth.kakao.clientId': 'kakao-client-id',
    'oauth.kakao.clientSecret': 'kakao-client-secret',
    'oauth.kakao.linkCallbackUrl': 'http://localhost:3000/auth/kakao-link/callback',
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
      KakaoLinkStrategy,
      { provide: ConfigService, useValue: config },
      { provide: getRepositoryToken(User), useValue: userRepository },
      { provide: getRepositoryToken(SocialAccount), useValue: socialAccountRepository },
    ],
  }).compile();

  return {
    strategy: moduleRef.get(KakaoLinkStrategy),
    config,
    userRepository,
    socialAccountRepository,
  };
};
