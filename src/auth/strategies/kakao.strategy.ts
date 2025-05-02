import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { FastifyRequest } from 'fastify';
import { Profile, Strategy, StrategyOptionWithRequest } from 'passport-kakao';

import { MissingSocialEmailException } from '@/common/exceptions/auth.exceptions';
import { AccessTokenPayload } from '@/types/user.types';
import { UserService } from '@/user/user.service';

interface KakaoProfileJson {
  kakao_account: { email: string };
  properties?: { profile_image?: string };
}

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    config: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      clientID: config.getOrThrow<string>('oauth.kakao.clientId'),
      clientSecret: config.getOrThrow<string>('oauth.kakao.clientSecret'),
      callbackURL: config.getOrThrow<string>('oauth.kakao.callbackUrl'),
      passReqToCallback: true,
      scope: ['profile_nickname', 'account_email', 'profile_image'],
    } as StrategyOptionWithRequest);
  }

  async validate(
    req: FastifyRequest,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<AccessTokenPayload> {
    const { kakao_account, properties } = profile._json as KakaoProfileJson;

    if (!kakao_account?.email) {
      throw new MissingSocialEmailException();
    }

    const providerId = profile.id;

    const existingUser = await this.userService.findUserBySocialAccount('kakao', providerId);
    if (existingUser) {
      return existingUser;
    }

    return await this.userService.createSocialUser({
      provider: 'kakao',
      providerId,
      email: kakao_account.email,
      name: profile.displayName,
      profileIcon: properties?.profile_image,
      socialRefreshToken: refreshToken,
    });
  }
}
