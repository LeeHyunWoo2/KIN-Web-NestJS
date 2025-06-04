import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { TokenService } from '@/auth/token.service';
import { AccessTokenPayload, SocialTokenUser } from '@/auth/types/auth-service.types';
import {
  AccessTokenBlacklistedException,
  AccessTokenInvalidException,
  AccessTokenMissingException,
  InvalidEmailTokenException,
  NoLinkedAccountException,
  OAuthTokenGenerationFailedException,
  RefreshTokenInvalidException,
  RefreshTokenMismatchException,
  RefreshTokenNotFoundException,
  SaveRefreshTokenException,
} from '@/common/exceptions';
import { REDIS_CLIENT } from '@/config/redis.provider.config';

import {
  createMockConfigService,
  MockConfigService,
  MockConfigType,
} from '../../test/utils/config.mock';
import { createMockJwtService, MockJwtService } from '../../test/utils/jwt.mock';
import { createMockRedis, MockRedis } from '../../test/utils/redis.mock';

interface SetupOptions {
  redis?: Partial<MockRedis>;
  config?: MockConfigType;
  jwt?: Partial<MockJwtService>;
}

const setupTokenServiceTest = async (
  overrides: SetupOptions = {},
): Promise<{
  tokenService: TokenService;
  redis: MockRedis;
  config: MockConfigService;
  jwt: MockJwtService;
}> => {
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
};

describe('TokenService', () => {
  describe('generateTokens', () => {
    it('AccessToken과 RefreshToken을 반환하고, RefreshToken을 Redis 에 저장해야 합니다.', async () => {
      const jwtSignAsyncMock = jest
        .fn()
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const { tokenService, redis } = await setupTokenServiceTest({
        config: {
          'auth.jwtExpiresIn': '3600',
        },
        jwt: {
          signAsync: jwtSignAsyncMock,
        },
      });
      const result = await tokenService.generateTokens(
        { id: 123456, email: 'user@email.com', role: 'user' },
        604800,
      );
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.refreshTokenTtl).toBe(604800);
      expect(redis.set).toHaveBeenCalledWith(
        'refreshToken:123456',
        JSON.stringify({
          token: 'refresh-token',
          rememberMe: false,
        }),
        'EX',
        604800,
      );
    });
  });

  describe('verifyAccessToken', () => {
    const accessToken = 'test-access-token';
    it('토큰이 유효하고 블랙리스트가 아닌 경우 페이로드를 반환해야 합니다. ', async () => {
      const payload = { id: 123456, email: 'user@email.com', role: 'user', exp: 123456789 };

      const { tokenService, redis, jwt } = await setupTokenServiceTest({
        redis: {
          get: jest.fn().mockResolvedValue(null),
        },
        jwt: {
          verifyAsync: jest.fn().mockResolvedValue(payload),
        },
      });
      const result = await tokenService.verifyAccessToken(accessToken);
      expect(result).toEqual(payload);
      expect(redis.get).toHaveBeenCalledWith(`blacklist:${accessToken}`);
      expect(jwt.verifyAsync).toHaveBeenCalledWith(accessToken, {
        secret: 'access-secret',
        algorithms: ['HS256'],
      });
    });
    it('토큰이 블랙리스트일 경우, AccessTokenBlacklistedException 을 던져야 합니다.', async () => {
      const { tokenService, redis } = await setupTokenServiceTest({
        redis: {
          get: jest.fn().mockResolvedValue('true'),
        },
      });
      await expect(tokenService.verifyAccessToken(accessToken)).rejects.toThrow(
        AccessTokenBlacklistedException,
      );
      expect(redis.get).toHaveBeenCalledWith(`blacklist:${accessToken}`);
    });
    it('토큰이 유효하지 않을 경우, AccessTokenInvalidException 을 던져야 합니다.', async () => {
      const { tokenService, redis, jwt } = await setupTokenServiceTest({
        redis: {
          get: jest.fn().mockResolvedValue(null),
        },
        jwt: {
          verifyAsync: jest.fn().mockRejectedValue(new Error('invalid token')),
        },
      });

      await expect(tokenService.verifyAccessToken('test-token')).rejects.toThrow(
        AccessTokenInvalidException,
      );
      expect(redis.get).toHaveBeenCalledWith('blacklist:test-token');
      expect(jwt.verifyAsync).toHaveBeenCalledWith('test-token', {
        secret: 'access-secret',
        algorithms: ['HS256'],
      });
    });
    it('토큰이 없을 경우 AccessTokenMissingException 을 던져야 합니다', async () => {
      const { tokenService } = await setupTokenServiceTest({});

      await expect(tokenService.verifyAccessToken('')).rejects.toThrow(AccessTokenMissingException);
    });
  });

  describe('verifyRefreshToken', () => {
    it('저장된 refreshToken과 일치하면 사용자 ID와 rememberMe를 반환해야 합니다.', async () => {
      const refreshToken = 'valid-refresh-token';
      const decoded = { id: 123456 };
      const stored = JSON.stringify({ token: refreshToken, rememberMe: true });

      const { tokenService, redis, jwt } = await setupTokenServiceTest({
        redis: {
          get: jest.fn().mockResolvedValue(stored),
        },
        jwt: {
          verifyAsync: jest.fn().mockResolvedValue(decoded),
        },
      });
      const result = await tokenService.verifyRefreshToken(refreshToken);
      expect(result).toEqual({ id: 123456, rememberMe: true });
      expect(jwt.verifyAsync).toHaveBeenCalledWith(refreshToken, {
        secret: 'refresh-secret',
        algorithms: ['HS256'],
      });
      expect(redis.get).toHaveBeenCalledWith('refreshToken:123456');
    });
    it('JWT 토큰 파싱에 실패하면 RefreshTokenInvalidException 을 던져야 합니다.', async () => {
      const refreshToken = 'invalid-refresh-token';

      const { tokenService } = await setupTokenServiceTest({
        jwt: {
          verifyAsync: jest.fn().mockRejectedValue(new Error('invalid token')),
        },
      });
      await expect(tokenService.verifyRefreshToken(refreshToken)).rejects.toThrow(
        RefreshTokenInvalidException,
      );
    });
    it('저장된 refreshToken과 일치하지 않으면 RefreshTokenMismatchException 을 던져야 합니다.', async () => {
      const refreshToken = 'different-refresh-token';
      const decoded = { id: 123456 };
      const stored = JSON.stringify({ token: 'valid-refresh-token', rememberMe: true });
      const { tokenService } = await setupTokenServiceTest({
        redis: {
          get: jest.fn().mockResolvedValue(stored),
        },
        jwt: {
          verifyAsync: jest.fn().mockResolvedValue(decoded),
        },
      });
      await expect(tokenService.verifyRefreshToken(refreshToken)).rejects.toThrow(
        RefreshTokenMismatchException,
      );
    });
    it('저장된 refreshToken이 없으면 RefreshTokenNotFoundException 을 던져야 합니다.', async () => {
      const refreshToken = 'missing-refresh-token';
      const decoded = { id: 123456 };

      const { tokenService } = await setupTokenServiceTest({
        jwt: {
          verifyAsync: jest.fn().mockResolvedValue(decoded),
        },
        redis: {
          get: jest.fn().mockResolvedValue(null),
        },
      });
      await expect(tokenService.verifyRefreshToken(refreshToken)).rejects.toThrow(
        RefreshTokenNotFoundException,
      );
    });
  });

  describe('getRemainingTtl', () => {
    it('Redis에 저장된 TTL이 정상적으로 반환되어야 합니다.', async () => {
      const { tokenService, redis } = await setupTokenServiceTest({
        redis: {
          ttl: jest.fn().mockResolvedValue(604800),
        },
      });
      const result = await tokenService.getRemainingTtl('refreshToken:123456');
      expect(result).toBe(604800);
      expect(redis.ttl).toHaveBeenCalledWith('refreshToken:123456');
    });
    it('TTL이 -1 또는 -2 일 경우 RefreshTokenInvalidException을 던져야 합니다.', async () => {
      const { tokenService } = await setupTokenServiceTest({
        redis: {
          ttl: jest.fn().mockResolvedValue(-1),
        },
      });
      await expect(tokenService.getRemainingTtl('refreshToken:123456')).rejects.toThrow(
        RefreshTokenInvalidException,
      );
    });
  });

  describe('generateOAuthToken', () => {
    const mockSocialAccount: SocialTokenUser = {
      socialAccounts: [
        {
          provider: 'google',
          providerId: 'google-id',
          socialRefreshToken: 'google-refresh-token',
        },
        {
          provider: 'kakao',
          providerId: 'kakao-id',
          socialRefreshToken: 'kakao-refresh-token',
        },
        {
          provider: 'naver',
          providerId: 'naver-id',
          socialRefreshToken: 'naver-refresh-token',
        },
      ],
    };
    beforeEach(() => {
      jest.resetModules();
    });
    it('소셜 계정이 없으면 NoLinkedAccountException 을 던져야 합니다.', async () => {
      const { tokenService } = await setupTokenServiceTest({});
      await expect(
        tokenService.generateOAuthToken({
          user: { socialAccounts: [] },
          provider: 'google',
        }),
      ).rejects.toThrow(NoLinkedAccountException);
    });
    it('provider가 google인 경우 accessToken 을 정상적으로 반환해야 합니다.', async () => {
      jest.mock('axios', () => ({
        default: {
          post: jest.fn().mockResolvedValue({
            data: {
              access_token: 'google-access-token',
            },
          }),
        },
      }));
      const { tokenService } = await setupTokenServiceTest({
        config: {
          'oauth.google.clientId': 'test-google-client-id',
          'oauth.google.clientSecret': 'test-google-client-secret',
        },
      });
      const result = await tokenService.generateOAuthToken({
        provider: 'google',
        user: mockSocialAccount,
      });
      expect(result).toBe('google-access-token');
    });
    it('provider가 kakao인 경우 accessToken을 정상적으로 반환해야 합니다.', async () => {
      jest.mock('axios', () => ({
        default: {
          post: jest.fn().mockResolvedValue({
            data: {
              access_token: 'kakao-access-token',
            },
          }),
        },
      }));
      const { tokenService } = await setupTokenServiceTest({
        config: {
          'oauth.kakao.clientId': 'test-kakao-client-id',
          'oauth.kakao.clientSecret': 'test-kakao-client-secret',
        },
      });
      const result = await tokenService.generateOAuthToken({
        provider: 'kakao',
        user: mockSocialAccount,
      });
      expect(result).toBe('kakao-access-token');
    });
    it('provider가 naver 경우 accessToken을 정상적으로 반환해야 합니다.', async () => {
      jest.mock('axios', () => ({
        default: {
          post: jest.fn().mockResolvedValue({
            data: {
              access_token: 'naver-access-token',
            },
          }),
        },
      }));
      const { tokenService } = await setupTokenServiceTest({
        config: {
          'oauth.naver.clientId': 'test-naver-client-id',
          'oauth.naver.clientSecret': 'test-naver-client-secret',
        },
      });
      const result = await tokenService.generateOAuthToken({
        provider: 'naver',
        user: mockSocialAccount,
      });
      expect(result).toBe('naver-access-token');
    });
    it('axios 요청이 실패하면 UnauthorizedException을 던져야 합니다.', async () => {
      jest.mock('axios', () => ({
        default: {
          post: jest.fn().mockRejectedValue(new Error('invalid token')),
        },
      }));
      const { tokenService } = await setupTokenServiceTest({
        config: {
          'oauth.google.clientId': 'test-client-id',
          'oauth.google.clientSecret': 'test-client-secret',
        },
      });
      await expect(
        tokenService.generateOAuthToken({
          provider: 'google',
          user: mockSocialAccount,
        }),
      ).rejects.toThrow(OAuthTokenGenerationFailedException);
    });
  });

  describe('saveRefreshTokenToRedis', () => {
    it('refreshToken을 Redis에 저장해야 합니다.', async () => {
      const { tokenService, redis } = await setupTokenServiceTest({});

      const id = 123456;
      const refreshToken = 'valid-refresh-token';
      const ttl = 604800;
      const rememberMe = true;

      await tokenService.saveRefreshTokenToRedis(id, refreshToken, ttl, rememberMe);
      expect(redis.set).toHaveBeenCalledWith(
        `refreshToken:${id}`,
        JSON.stringify({ token: refreshToken, rememberMe }),
        'EX',
        ttl,
      );
    });
    it('Redis 저장 중 오류가 발생하면 SaveRefreshTokenException을 던져야 합니다.', async () => {
      const setRedisMock = jest.fn().mockRejectedValue(new Error('Redis error'));

      const { tokenService } = await setupTokenServiceTest({
        redis: {
          set: setRedisMock,
        },
      });
      await expect(
        tokenService.saveRefreshTokenToRedis(123456, 'token', 3600, true),
      ).rejects.toThrow(SaveRefreshTokenException);
    });
  });

  describe('invalidateAccessToken', () => {
    it('유효한 accessToken이면 Redis에 blacklist로 저장해야 합니다.', async () => {
      const now = Date.now();
      const mockExp = Math.floor((now + 1000) / +60);
      const accessToken = 'valid-access-token';

      const { tokenService, redis } = await setupTokenServiceTest({
        redis: {
          get: jest.fn().mockResolvedValue(null),
        },
        jwt: {
          decode: jest.fn().mockReturnValue({
            id: 123456,
            email: 'user@email.com',
            role: 'user',
            exp: mockExp,
          }),
        },
      });

      await tokenService.invalidateAccessToken(accessToken);
      expect(redis.set).toHaveBeenCalledWith(
        `blacklist:${accessToken}`,
        'true',
        'EX',
        expect.any(Number),
      );
    });
    it('verifyAccessToken이 null이면 Redis에 아무것도 저장하지 않아야 합니다.', async () => {
      const accessToken = 'null-access-token';
      const { tokenService, redis } = await setupTokenServiceTest({});
      jest
        .spyOn(tokenService, 'verifyAccessToken')
        .mockResolvedValue(null as unknown as AccessTokenPayload);
      await tokenService.invalidateAccessToken(accessToken);
      expect(redis.set).not.toHaveBeenCalled();
    });
    it('exp가 없으면 Redis에 저장하지 않아야 합니다.', async () => {
      const accessToken = 'expired-token';
      const { tokenService, redis } = await setupTokenServiceTest({});
      jest.spyOn(tokenService, 'verifyAccessToken').mockResolvedValue({
        id: 123456,
        email: 'user@email.com',
        role: 'user',
        exp: undefined,
      });
      await tokenService.invalidateAccessToken(accessToken);
      expect(redis.set).not.toHaveBeenCalled();
    });
  });

  describe('deleteRefreshTokenFromRedis', () => {
    it('refreshToken과 publicProfile 캐시를 Redis에서 정상적으로 삭제해야 합니다.', async () => {
      const redisDeleteMock = jest.fn();
      const { tokenService } = await setupTokenServiceTest({
        redis: {
          del: redisDeleteMock,
        },
      });
      await tokenService.deleteRefreshTokenFromRedis(123456);
      expect(redisDeleteMock).toHaveBeenCalledWith('refreshToken:123456');
      expect(redisDeleteMock).toHaveBeenCalledWith('publicProfile:123456');
    });
  });

  describe('generateEmailVerificationToken', () => {
    it('이메일 인증용 토큰을 생성해야 합니다.', async () => {
      const jwtSignAsyncMock = jest.fn().mockReturnValue('test-token');
      const { tokenService } = await setupTokenServiceTest({
        jwt: {
          sign: jwtSignAsyncMock,
        },
      });
      const token = tokenService.generateEmailVerificationToken('test@email.com');
      expect(token).toBe('test-token');
      expect(jwtSignAsyncMock).toHaveBeenCalledWith(
        { email: 'test@email.com' },
        {
          expiresIn: '10m',
          secret: 'access-secret',
        },
      );
    });
  });

  describe('verifyEmailVerificationToken', () => {
    it('유효한 이메일 인증 토큰이면 payload를 반환해야 합니다.', async () => {
      const mockPayload = { email: 'test@email.com' };

      const { tokenService } = await setupTokenServiceTest({
        jwt: {
          verify: jest.fn().mockReturnValue(mockPayload),
        },
      });
      const result = await tokenService.verifyEmailVerificationToken('test-token');
      expect(result).toEqual(mockPayload);
    });
    it('유효하지 않은 이메일 토큰이면 InvalidEmailTokenException 을 던져야 합니다.', async () => {
      const { tokenService } = await setupTokenServiceTest({
        jwt: {
          verify: jest.fn().mockImplementation(() => {
            throw new InvalidEmailTokenException();
          }),
        },
      });
      await expect(tokenService.verifyEmailVerificationToken('test-token')).rejects.toThrow(
        InvalidEmailTokenException,
      );
    });
  });
});
