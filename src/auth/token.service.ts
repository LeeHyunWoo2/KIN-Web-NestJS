import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Redis } from 'ioredis';

import {
  AccessTokenPayload,
  EmailTokenPayload,
  GenerateOAuthToken,
  RefreshTokenPayload,
  TokenPair,
} from '@/auth/types/auth-service.types';
import { LogExecutionTime } from '@/common/decorators/log-execution-time.decorator';
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

@Injectable()
export class TokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenSecret = configService.getOrThrow<string>('auth.accessTokenSecret');
    this.refreshTokenSecret = configService.getOrThrow<string>('auth.refreshTokenSecret');
  }

  @LogExecutionTime()
  async generateTokens(payload: AccessTokenPayload, refreshTtl: number): Promise<TokenPair> {
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get<number>('auth.jwtExpiration'),
    });

    const refreshToken = await this.jwtService.signAsync(
      { id: payload.id },
      {
        secret: this.refreshTokenSecret,
        expiresIn: refreshTtl,
      },
    );

    await this.saveRefreshTokenToRedis(payload.id, refreshToken, refreshTtl, false);
    return { accessToken, refreshToken, refreshTokenTtl: refreshTtl };
  }

  @LogExecutionTime()
  async verifyAccessToken(accessToken: string): Promise<AccessTokenPayload> {
    if (!accessToken) {
      throw new AccessTokenMissingException();
    }

    const isBlacklisted = await this.redisClient.get(`blacklist:${accessToken}`);
    if (isBlacklisted) {
      throw new AccessTokenBlacklistedException();
    }

    try {
      return await this.jwtService.verifyAsync(accessToken, {
        secret: this.accessTokenSecret,
        algorithms: ['HS256'],
      });
    } catch {
      throw new AccessTokenInvalidException();
    }
  }

  @LogExecutionTime()
  async verifyRefreshToken(refreshToken: string): Promise<RefreshTokenPayload> {
    let decoded: { id: number };
    try {
      decoded = await this.jwtService.verifyAsync<{ id: number }>(refreshToken, {
        secret: this.refreshTokenSecret,
        algorithms: ['HS256'],
      });
    } catch {
      throw new RefreshTokenInvalidException();
    }

    const stored = await this.redisClient.get(`refreshToken:${decoded.id}`);
    if (!stored) throw new RefreshTokenNotFoundException();

    const parsed = JSON.parse(stored) as { token: string; rememberMe: boolean };
    if (parsed.token !== refreshToken) throw new RefreshTokenMismatchException();

    return { id: decoded.id, rememberMe: parsed.rememberMe };
  }

  async getRemainingTtl(key: string): Promise<number> {
    const ttl = await this.redisClient.ttl(key);
    // -2: key 없음, -1: ttl 없음
    if (ttl < 0) {
      throw new RefreshTokenInvalidException();
    }
    return ttl;
  }

  @LogExecutionTime()
  async generateOAuthToken(data: GenerateOAuthToken): Promise<string> {
    const { user, provider } = data;
    const axios = (await import('axios')).default;
    const account = user.socialAccounts.find((a) => a.provider === provider);
    if (!account) throw new NoLinkedAccountException();
    if (this.configService.get<string>('app.nodeEnv') === 'test') {
      return `mock-oauth-${provider}-access-token`;
    }
    try {
      if (provider === 'google') {
        const res = await axios.post<{ access_token: string }>(
          'https://oauth2.googleapis.com/token',
          {
            client_id: this.configService.getOrThrow<string>(`oauth.${provider}.clientId`),
            client_secret: this.configService.getOrThrow<string>(`oauth.${provider}.clientSecret`),
            refresh_token: account.socialRefreshToken,
            grant_type: 'refresh_token',
          },
        );
        return res.data.access_token;
      }

      const params = {
        grant_type: 'refresh_token',
        client_id: this.configService.getOrThrow<string>(`oauth.${provider}.clientId`),
        client_secret: this.configService.getOrThrow<string>(`oauth.${provider}.clientSecret`),
        refresh_token: account.socialRefreshToken,
      };

      const url =
        provider === 'kakao'
          ? 'https://kauth.kakao.com/oauth/token'
          : 'https://nid.naver.com/oauth2.0/token';

      const res = await axios.post<{ access_token: string }>(url, null, { params });
      return res.data.access_token;
    } catch {
      throw new OAuthTokenGenerationFailedException();
    }
  }

  async invalidateAccessToken(accessToken: string): Promise<void> {
    const decoded: AccessTokenPayload = await this.jwtService.decode(accessToken);
    if (!decoded) return;
    const ttl = decoded.exp ? Math.floor((decoded.exp * 1000 - Date.now()) / 1000) : 0;
    if (ttl > 0) await this.redisClient.set(`blacklist:${accessToken}`, 'true', 'EX', ttl);
  }

  async saveRefreshTokenToRedis(
    id: number,
    refreshToken: string,
    ttl: number,
    rememberMe: boolean,
  ): Promise<void> {
    try {
      await this.redisClient.set(
        `refreshToken:${id}`,
        JSON.stringify({ token: refreshToken, rememberMe }),
        'EX',
        ttl,
      );
    } catch {
      throw new SaveRefreshTokenException();
    }
  }

  async deleteRefreshTokenFromRedis(id: number): Promise<void> {
    await this.redisClient.del(`refreshToken:${id}`);
    await this.redisClient.del(`publicProfile:${id}`);
  }

  generateEmailVerificationToken(email: string): string {
    return this.jwtService.sign({ email }, { expiresIn: '10m', secret: this.accessTokenSecret });
  }

  async verifyEmailVerificationToken(token: string): Promise<EmailTokenPayload> {
    try {
      return this.jwtService.verify(token, { secret: this.accessTokenSecret });
    } catch {
      throw new InvalidEmailTokenException();
    }
  }
}
