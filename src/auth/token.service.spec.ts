import { InvalidEmailTokenException } from '@/common/exceptions/auth.exceptions';
import {
  RefreshTokenInvalidException,
  RefreshTokenMismatchException,
} from '@/common/exceptions/token.exceptions';
import { AccessTokenPayload, SocialTokenUser } from '@/types/user.types';

import { setupTokenServiceTest } from '../../test/utils/setup-token-service.module';

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
        { id: 'user123', email: 'user@email.com', role: 'user' },
        604800,
      );
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.refreshTokenTtl).toBe(604800);
      expect(redis.set).toHaveBeenCalledWith(
        'refreshToken:user123',
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
      const payload = { id: 'user123', email: 'user@email.com', role: 'user', exp: 123456789 };

      const { tokenService, redis, jwt } = await setupTokenServiceTest({
        redis: {
          get: jest.fn().mockResolvedValue(null), // 블랙리스트 아님
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
    it('토큰이 블랙리스트일 경우, 예외를 던져야 합니다.', async () => {
      const { tokenService, redis } = await setupTokenServiceTest({
        redis: {
          get: jest.fn().mockResolvedValue('true'),
        },
      });
      await expect(tokenService.verifyAccessToken(accessToken)).rejects.toThrow(
        'Access token is blacklisted',
      );
      expect(redis.get).toHaveBeenCalledWith(`blacklist:${accessToken}`);
    });
    it('토큰이 유효하지 않을 경우, 예외를 던져야 합니다.', async () => {
      const { tokenService, redis, jwt } = await setupTokenServiceTest({
        redis: {
          get: jest.fn().mockResolvedValue(null),
        },
        jwt: {
          verifyAsync: jest.fn().mockRejectedValue(new Error('invalid token')),
        },
      });

      await expect(tokenService.verifyAccessToken('test-token')).rejects.toThrow(
        'Access token is invalid',
      );
      expect(redis.get).toHaveBeenCalledWith('blacklist:test-token');
      expect(jwt.verifyAsync).toHaveBeenCalledWith('test-token', {
        secret: 'access-secret',
        algorithms: ['HS256'],
      });
    });
    it('토큰이 없을 경우 예외를 던져야 합니다', async () => {
      const { tokenService } = await setupTokenServiceTest({});

      await expect(tokenService.verifyAccessToken('')).rejects.toThrow('Access token is required');
    });
  });

  describe('verifyRefreshToken', () => {
    it('저장된 refreshToken과 일치하면 사용자 ID와 rememberMe를 반환해야 합니다.', async () => {
      const refreshToken = 'valid-refresh-token';
      const decoded = { id: 'user123' };
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
      expect(result).toEqual({ id: 'user123', rememberMe: true });
      expect(jwt.verifyAsync).toHaveBeenCalledWith(refreshToken, {
        secret: 'refresh-secret',
        algorithms: ['HS256'],
      });
      expect(redis.get).toHaveBeenCalledWith('refreshToken:user123');
    });
    it('JWT 토큰 파싱에 실패하면 RefreshTokenInvalidException 커스텀 에러를 던져야 합니다.', async () => {
      const refreshToken = 'invalid-refresh-token';

      const { tokenService } = await setupTokenServiceTest({
        jwt: {
          verifyAsync: jest.fn().mockRejectedValue(new Error('invalid token')),
        },
      });
      await expect(tokenService.verifyRefreshToken(refreshToken)).rejects.toThrow(
        new RefreshTokenInvalidException(),
      );
    });
    it('저장된 refreshToken과 일치하지 않으면 RefreshTokenMismatchException 를 던져야 합니다.', async () => {
      const refreshToken = 'different-refresh-token';
      const decoded = { id: 'user123' };
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
        new RefreshTokenMismatchException(),
      );
    });
    it('저장된 refreshToken이 없으면 예외를 던져야 합니다.', async () => {
      const refreshToken = 'missing-refresh-token';
      const decoded = { id: 'user123' };

      const { tokenService } = await setupTokenServiceTest({
        jwt: {
          verifyAsync: jest.fn().mockResolvedValue(decoded),
        },
        redis: {
          get: jest.fn().mockResolvedValue(null),
        },
      });
      await expect(tokenService.verifyRefreshToken(refreshToken)).rejects.toThrow(
        '다시 로그인해주세요.',
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
      const result = await tokenService.getRemainingTtl('refreshToken:user123');
      expect(result).toBe(604800);
      expect(redis.ttl).toHaveBeenCalledWith('refreshToken:user123');
    });
    it('TTL이 -1 또는 -2 일 경우 RefreshTokenInvalidException을 던져야 합니다.', async () => {
      const { tokenService } = await setupTokenServiceTest({
        redis: {
          ttl: jest.fn().mockResolvedValue(-1),
        },
      });
      await expect(tokenService.getRemainingTtl('refreshToken:user123')).rejects.toThrow(
        new RefreshTokenInvalidException(),
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
      jest.resetModules(); // axios 가 동적 import를 하기 때문에 필요함
    });
    it('소셜 계정이 없으면 예외를 던져야 합니다.', async () => {
      const { tokenService } = await setupTokenServiceTest({});
      await expect(
        tokenService.generateOAuthToken({
          user: { socialAccounts: [] },
          provider: 'google',
        }),
      ).rejects.toThrow('No linked account');
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
          'oauth.clientId': 'test-google-client-id',
          'oauth.clientSecret': 'test-google-client-secret',
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
          'oauth.clientId': 'test-kakao-client-id',
          'oauth.clientSecret': 'test-kakao-client-secret',
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
          'oauth.clientId': 'test-naver-client-id',
          'oauth.clientSecret': 'test-naver-client-secret',
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
          'oauth.clientId': 'test-client-id',
          'oauth.clientSecret': 'test-client-secret',
        },
      });
      await expect(
        tokenService.generateOAuthToken({
          provider: 'google',
          user: mockSocialAccount,
        }),
      ).rejects.toThrow('OAuth token generation failed');
    });
  });

  describe('saveRefreshTokenToRedis', () => {
    it('refreshToken을 Redis에 저장해야 합니다.', async () => {
      const { tokenService, redis } = await setupTokenServiceTest({});

      const userId = 'user123';
      const refreshToken = 'valid-refresh-token';
      const ttl = 604800;
      const rememberMe = true;

      await tokenService.saveRefreshTokenToRedis(userId, refreshToken, ttl, rememberMe);
      expect(redis.set).toHaveBeenCalledWith(
        `refreshToken:${userId}`,
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
        tokenService.saveRefreshTokenToRedis('user123', 'token', 3600, true),
      ).rejects.toThrow('문제가 발생했습니다. 다시 시도해주세요');
    });
  });

  describe('invalidateAccessToken', () => {
    it('유효한 accessToken이면 Redis에 blacklist로 저장해야 합니다.', async () => {
      // TODO : decoded.exp는 초 단위이므로 Date.now()와 비교할 때 단위 mismatch 주의
      // 이전 Express 버전에서는 exp * 1000 - Date.now() 로 계산했던 코드가 있었음
      // 마이그레이션 후 단위를 맞추지 않아 음수 TTL이 생겼고, redis.set()이 실행되지 않음
      // 테스트 코드 덕분에 문제를 조기 발견함 (verifyAccessToken + invalidateAccessToken 연계 테스트)
      // → 현재는 exp - Math.floor(Date.now() / 1000) 방식으로 수정하여 단위 일치시킴

      const now = Date.now();
      const mockExp = Math.floor((now + 1000) / +60);
      const accessToken = 'valid-access-token';

      const { tokenService, redis } = await setupTokenServiceTest({
        redis: {
          get: jest.fn().mockResolvedValue(null),
        },
      });
      jest.spyOn(tokenService, 'verifyAccessToken').mockResolvedValue({
        id: 'user123',
        email: 'user@email.com',
        role: 'user',
        exp: mockExp,
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
        id: 'user123',
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
      await tokenService.deleteRefreshTokenFromRedis('user123');
      expect(redisDeleteMock).toHaveBeenCalledWith('refreshToken:user123');
      expect(redisDeleteMock).toHaveBeenCalledWith('publicProfile:user123');
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
    it('유효하지 않은 이메일 토큰이면 InvalidEmailTokenException을 던져야 합니다.', async () => {
      const { tokenService } = await setupTokenServiceTest({
        jwt: {
          verify: jest.fn().mockImplementation(() => {
            throw new InvalidEmailTokenException();
          }),
        },
      });
      await expect(tokenService.verifyEmailVerificationToken('test-token')).rejects.toThrow(
        new InvalidEmailTokenException(),
      );
    });
  });
});
