import { getRepositoryToken } from '@mikro-orm/nestjs';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from '@/auth/auth.service';
import { TokenService } from '@/auth/token.service';
import { SocialAccount } from '@/user/entity/social-account.entity';
import { User } from '@/user/entity/user.entity';

import { createMockConfigService } from './config.mock';
import { createMockRepository, MockRepository } from './repository.mock';

interface SetupOptions {
  userRepo?: Partial<MockRepository<User>>;
  socialRepo?: Partial<MockRepository<SocialAccount>>;
  tokenService?: Partial<TokenService>;
  config?: Record<string, string | number>;
}

export async function setupAuthServiceTest(overrides: SetupOptions = {}): Promise<{
  authService: AuthService;
  userRepository: MockRepository<User>;
  socialAccountRepository: MockRepository<SocialAccount>;
  config: ConfigService;
  tokenService: TokenService;
}> {
  const userRepository = {
    ...createMockRepository<User>(),
    ...overrides.userRepo,
  };

  const socialAccountRepository = {
    ...createMockRepository<SocialAccount>(),
    ...overrides.socialRepo,
  };

  const config = createMockConfigService({
    'auth.refreshTokenTtl': 604800,
    'auth.rememberRefreshTokenTtl': 2592000,
    'auth.refreshTokenRenewThreshold': 10800,
    'auth.rememberRefreshTokenRenewThreshold': 259200,
    ...(overrides.config || {}),
  });

  const tokenService = {
    generateTokens: jest.fn(),
    verifyRefreshToken: jest.fn(),
    getRemainingTtl: jest.fn(),
    ...overrides.tokenService,
  } as unknown as TokenService;

  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: getRepositoryToken(User), useValue: userRepository },
      { provide: getRepositoryToken(SocialAccount), useValue: socialAccountRepository },
      { provide: ConfigService, useValue: config },
      { provide: TokenService, useValue: tokenService },
    ],
  }).compile();

  return {
    authService: moduleRef.get(AuthService),
    userRepository,
    socialAccountRepository,
    config: moduleRef.get(ConfigService),
    tokenService,
  };
}
