import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Redis } from 'ioredis';

import { CatchAndLog } from '@/common/decorators/catch-and-log.decorator';
import { LogExecutionTime } from '@/common/decorators/log-execution-time.decorator';
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

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.accessTokenSecret = config.getOrThrow<string>('auth.accessTokenSecret');
  }

  /*  @CatchAndLog()
  @LogExecutionTime()
  async generateTokens(
    user: GenerateTokenInput,
    rememberMe = false,
    existingTtl: number | null = null,
  ): Promise<TokenPair> {
    const accessToken = await this.jwtService.signAsync(
      { id: user._id, email: user.email, role: user.role },
      { expiresIn: this.config.get<number>('auth.jwtExpiration') },
    );

    const refreshTokenTtl =
      existingTtl ??
      (rememberMe
        ? this.config.getOrThrow<number>('auth.rememberRefreshTokenTtl')
        : this.config.getOrThrow<number>('auth.refreshTokenTtl'));

    const refreshToken = await this.jwtService.signAsync(
      { id: user._id },
      {
        secret: this.config.get<string>('auth.refreshTokenSecret'),
        expiresIn: refreshTokenTtl,
      },
    );

    await this.saveRefreshTokenToRedis(user._id, refreshToken, refreshTokenTtl, rememberMe);

    return { accessToken, refreshToken, refreshTokenTtl };
  }*/

  @CatchAndLog()
  @LogExecutionTime()
  async generateTokens(payload: AccessTokenPayload, refreshTtl: number): Promise<TokenPair> {
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.config.get<number>('auth.jwtExpiration'),
    });

    const refreshToken = await this.jwtService.signAsync(
      { id: payload.id },
      {
        secret: this.config.get<string>('auth.refreshTokenSecret'),
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
      return await this.jwtService.verifyAsync<AccessTokenPayload>(accessToken, {
        secret: this.accessTokenSecret,
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException('Access token is invalid');
    }
  }

  /*  @CatchAndLog()
  @LogExecutionTime()
  async verifyRefreshToken(refreshToken: string): Promise<RefreshTokenPayload> {
    try {
      const decoded = await this.jwtService.verifyAsync<{ id: string }>(refreshToken, {
        secret: this.config.get<string>('auth.refreshTokenSecret'),
        algorithms: ['HS256'],
      });
      const userId = decoded.id;
      const stored = await this.redisClient.get(`refreshToken:${userId}`);
      if (!stored) throw new UnauthorizedException('Refresh token not found');

      const storedToken = JSON.parse(stored) as { token: string; rememberMe: boolean };

      if (storedToken.token !== refreshToken)
        throw new UnauthorizedException('Refresh token mismatch');

      let ttl: number | undefined = await this.redisClient.ttl(`refreshToken:${userId}`);
      if (ttl < 0) throw new UnauthorizedException('Refresh token expired');

      const threshold = storedToken.rememberMe
        ? this.config.getOrThrow<number>('auth.rememberRefreshTokenRenewThreshold')
        : this.config.getOrThrow<number>('auth.refreshTokenRenewThreshold');

      const refreshTokenTtl = storedToken.rememberMe
        ? this.config.getOrThrow<number>('auth.rememberRefreshTokenTtl')
        : this.config.getOrThrow<number>('auth.refreshTokenTtl');

      if (ttl < threshold) {
        ttl = refreshTokenTtl;
      }

      return { id: userId, rememberMe: storedToken.rememberMe, ttl };
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }
  }*/

  @CatchAndLog()
  @LogExecutionTime()
  async verifyRefreshToken(refreshToken: string): Promise<{ id: string; rememberMe: boolean }> {
    try {
      const decoded = await this.jwtService.verifyAsync<{ id: string }>(refreshToken, {
        secret: this.config.get<string>('auth.refreshTokenSecret'),
        algorithms: ['HS256'],
      });

      const stored = await this.redisClient.get(`refreshToken:${decoded.id}`);
      if (!stored) throw new UnauthorizedException('Refresh token not found');

      const parsed = JSON.parse(stored) as { token: string; rememberMe: boolean };
      if (parsed.token !== refreshToken) throw new UnauthorizedException('Refresh token mismatch');

      return { id: decoded.id, rememberMe: parsed.rememberMe };
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }
  }

  @CatchAndLog()
  @LogExecutionTime()
  async getRemainingTtl(key: string): Promise<number> {
    const ttl = await this.redisClient.ttl(key);
    // -2: key 없음, -1: ttl 없음
    if (ttl < 0) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
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
    const decoded = (await this.verifyAccessToken(accessToken)) as unknown as {
      exp: number;
    } | null;
    if (!decoded) return;
    const ttl = Math.floor((decoded.exp - Date.now()) / 1000);
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
      throw new InternalServerErrorException('failed to save refresh token to redis');
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

  verifyEmailVerificationToken(token: string): EmailTokenPayload | null {
    try {
      return this.jwtService.verify<EmailTokenPayload>(token, { secret: this.accessTokenSecret });
    } catch {
      return null;
    }
  }
}
