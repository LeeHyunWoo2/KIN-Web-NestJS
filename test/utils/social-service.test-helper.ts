import { getRepositoryToken } from '@mikro-orm/nestjs';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { SocialService } from '@/auth/social.service';
import { TokenService } from '@/auth/token.service';
import { SocialAccount } from '@/user/entity/social-account.entity';
import { User } from '@/user/entity/user.entity';

import { createMockConfigService, MockConfigService, MockConfigType } from './config.mock';
import { createMockRepository, MockRepository } from './repository.mock';

interface SetupOptions {
  config?: MockConfigType;
  tokenService?: Partial<TokenService>;
  userRepo?: Partial<MockRepository<User>>;
  socialRepo?: Partial<MockRepository<SocialAccount>>;
}

export const setupSocialServiceTest = async (
  overrides: SetupOptions = {},
): Promise<{
  socialService: SocialService;
  config: MockConfigService;
  tokenService: TokenService;
  userRepository: MockRepository<User>;
  socialAccountRepository: MockRepository<SocialAccount>;
}> => {
  const config = createMockConfigService({
    'app.frontendOrigin': 'http://localhost:3000',
    'auth.refreshTokenTtl': 604800,
    ...(overrides.config || {}),
  });

  const tokenService = {
    generateTokens: jest.fn(),
    generateOAuthToken: jest.fn(),
    ...overrides.tokenService,
  } as TokenService;
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
      SocialService,
      { provide: ConfigService, useValue: config },
      { provide: TokenService, useValue: tokenService },
      { provide: getRepositoryToken(User), useValue: userRepository },
      { provide: getRepositoryToken(SocialAccount), useValue: socialAccountRepository },
    ],
  }).compile();

  return {
    socialService: moduleRef.get(SocialService),
    config,
    tokenService,
    userRepository,
    socialAccountRepository,
  };
};
