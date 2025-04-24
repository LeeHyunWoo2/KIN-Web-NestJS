import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Redis } from 'ioredis';

import { CatchAndLog } from '@/common/decorators/catch-and-log.decorator';
import { LogExecutionTime } from '@/common/decorators/log-execution-time.decorator';
import { InvalidEmailTokenException } from '@/common/exceptions/auth.exceptions';
import {
  RefreshTokenInvalidException,
  RefreshTokenMismatchException,
  RefreshTokenNotFoundException,
  SaveRefreshTokenException,
} from '@/common/exceptions/token.exceptions';
import { REDIS_CLIENT } from '@/config/redis.provider.config';
import {
  AccessTokenPayload,
  EmailTokenPayload,
  GenerateOAuthToken,
  TokenPair,
} from '@/types/user.types';

@Injectable()
export class TokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.accessTokenSecret = config.getOrThrow<string>('auth.accessTokenSecret');
    this.refreshTokenSecret = config.getOrThrow<string>('auth.refreshTokenSecret');
  }

  @CatchAndLog()
  @LogExecutionTime()
  async generateTokens(payload: AccessTokenPayload, refreshTtl: number): Promise<TokenPair> {
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.config.get<number>('auth.jwtExpiration'),
    });

    const refreshToken = await this.jwtService.signAsync(
      { id: payload.id },
      {
        secret: this.refreshTokenSecret,
        expiresIn: refreshTtl,
      },
    );

    await this.saveRefreshTokenToRedis(payload.id, refreshToken, refreshTtl, false); // rememberMe 여부는 외부에서
    return { accessToken, refreshToken, refreshTokenTtl: refreshTtl };
  }

  @CatchAndLog()
  @LogExecutionTime()
  async verifyAccessToken(accessToken: string): Promise<AccessTokenPayload> {
    if (!accessToken) {
      throw new UnauthorizedException('Access token is required');
    }

    const isBlacklisted = await this.redisClient.get(`blacklist:${accessToken}`);
    if (isBlacklisted) {
      throw new UnauthorizedException('Access token is blacklisted');
    }

    try {
      return await this.jwtService.verifyAsync(accessToken, {
        secret: this.accessTokenSecret,
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException('Access token is invalid');
    }
  }

  @CatchAndLog()
  @LogExecutionTime()
  async verifyRefreshToken(refreshToken: string): Promise<{ id: string; rememberMe: boolean }> {
    let decoded: { id: string };
    try {
      decoded = await this.jwtService.verifyAsync<{ id: string }>(refreshToken, {
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

  @CatchAndLog()
  @LogExecutionTime()
  async getRemainingTtl(key: string): Promise<number> {
    const ttl = await this.redisClient.ttl(key);
    // -2: key 없음, -1: ttl 없음
    if (ttl < 0) {
      throw new RefreshTokenInvalidException();
    }
    return ttl;
  }

  @CatchAndLog()
  @LogExecutionTime()
  async generateOAuthToken(data: GenerateOAuthToken): Promise<string> {
    const { user, provider } = data;
    const axios = (await import('axios')).default;
    const account = user.socialAccounts.find((a) => a.provider === provider);
    if (!account) throw new UnauthorizedException('No linked account');

    try {
      if (provider === 'google') {
        const res = await axios.post<{ access_token: string }>(
          'https://oauth2.googleapis.com/token',
          {
            client_id: this.config.getOrThrow<string>('oauth.clientId'),
            client_secret: this.config.getOrThrow<string>('oauth.clientSecret'),
            refresh_token: account.socialRefreshToken,
            grant_type: 'refresh_token',
          },
        );
        return res.data.access_token;
      }

      const params = {
        grant_type: 'refresh_token',
        client_id: process.env[`${provider.toUpperCase()}_CLIENT_ID`]!,
        client_secret: process.env[`${provider.toUpperCase()}_CLIENT_SECRET`]!,
        refresh_token: account.socialRefreshToken,
      };

      const url =
        provider === 'kakao'
          ? 'https://kauth.kakao.com/oauth/token'
          : 'https://nid.naver.com/oauth2.0/token';

      const res = await axios.post<{ access_token: string }>(url, null, { params });
      return res.data.access_token;
    } catch {
      throw new UnauthorizedException('OAuth token generation failed');
    }
  }

  async invalidateAccessToken(accessToken: string): Promise<void> {
    const decoded = await this.verifyAccessToken(accessToken);
    if (!decoded) return;
    const ttl = decoded.exp ? Math.floor((decoded.exp * 1000 - Date.now()) / 1000) : 0;
    if (ttl > 0) await this.redisClient.set(`blacklist:${accessToken}`, 'true', 'EX', ttl);
  }

  @CatchAndLog()
  @LogExecutionTime()
  async saveRefreshTokenToRedis(
    userId: string,
    refreshToken: string,
    ttl: number,
    rememberMe: boolean,
  ): Promise<void> {
    try {
      await this.redisClient.set(
        `refreshToken:${userId}`,
        JSON.stringify({ token: refreshToken, rememberMe }),
        'EX',
        ttl,
      );
    } catch {
      throw new SaveRefreshTokenException();
    }
  }

  async deleteRefreshTokenFromRedis(userId: string): Promise<void> {
    await this.redisClient.del(`refreshToken:${userId}`);
    await this.redisClient.del(`publicProfile:${userId}`);
  }

  @CatchAndLog()
  @LogExecutionTime()
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
