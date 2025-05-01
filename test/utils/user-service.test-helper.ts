import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';

import { TokenService } from '@/auth/token.service';
import { REDIS_CLIENT } from '@/config/redis.provider.config';
import { SocialAccount } from '@/user/entity/social-account.entity';
import { User } from '@/user/entity/user.entity';
import { UserService } from '@/user/user.service';

import { createMockRedis, MockRedis } from './redis.mock';
import { createMockRepository, MockRepository } from './repository.mock';

interface SetupUserServiceOptions {
  redis?: Partial<MockRedis>;
  userRepo?: Partial<MockRepository<User>>;
  socialRepo?: Partial<MockRepository<SocialAccount>>;
  tokenService?: Partial<TokenService>;
}

export async function setupUserServiceTest(overrides: SetupUserServiceOptions = {}): Promise<{
  userService: UserService;
  redis: MockRedis;
  userRepository: MockRepository<User>;
  socialAccountRepository: MockRepository<SocialAccount>;
  tokenService: TokenService;
}> {
  const redis = { ...createMockRedis(), ...overrides.redis };
  const userRepository = { ...createMockRepository<User>(), ...overrides.userRepo };
  const socialAccountRepository = {
    ...createMockRepository<SocialAccount>(),
    ...overrides.socialRepo,
  };
  const tokenService = {
    verifyRefreshToken: jest.fn(),
    deleteRefreshTokenFromRedis: jest.fn(),
    invalidateAccessToken: jest.fn(),
    ...overrides.tokenService,
  } as unknown as TokenService;

  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      UserService,
      { provide: REDIS_CLIENT, useValue: redis },
      { provide: getRepositoryToken(User), useValue: userRepository },
      { provide: getRepositoryToken(SocialAccount), useValue: socialAccountRepository },
      { provide: TokenService, useValue: tokenService },
    ],
  }).compile();

  return {
    userService: moduleRef.get(UserService),
    redis,
    userRepository,
    socialAccountRepository,
    tokenService,
  };
}
