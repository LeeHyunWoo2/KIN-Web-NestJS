import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { TokenService } from '@/auth/token.service';
import { REDIS_CLIENT } from '@/config/redis.provider.config';

import { createMockConfigService, MockConfigService } from './mock-config';
import { createMockJwtService, MockJwtService } from './mock-jwt';
import { createMockRedis, MockRedis } from './mock-redis';

interface SetupOptions {
  redis?: Partial<MockRedis>;
  config?: Record<string, string | number>;
  jwt?: Partial<MockJwtService>;
}

export async function setupTokenServiceTest(overrides: SetupOptions = {}): Promise<{
  tokenService: TokenService;
  redis: MockRedis;
  config: MockConfigService;
  jwt: MockJwtService;
}> {
  const defaultConfig = {
    'auth.accessTokenSecret': 'access-secret',
    'auth.refreshTokenSecret': 'refresh-secret',
  };

  const redis = { ...createMockRedis(), ...overrides.redis };
  const config = createMockConfigService({ ...defaultConfig, ...(overrides.config || {}) });
  const jwt = { ...createMockJwtService(), ...overrides.jwt };

  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      TokenService,
      { provide: REDIS_CLIENT, useValue: redis },
      { provide: ConfigService, useValue: config },
      { provide: JwtService, useValue: jwt },
    ],
  }).compile();

  return {
    tokenService: moduleRef.get(TokenService),
    redis,
    config,
    jwt,
  };
}
