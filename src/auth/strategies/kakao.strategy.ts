import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { FastifyRequest } from 'fastify';
import { Profile, Strategy, StrategyOptionWithRequest } from 'passport-kakao';

import { MissingSocialEmailException } from '@/common/exceptions/auth.exceptions';
import { AccessTokenPayload, CreateSocialUserInput } from '@/types/user.types';
import { UserService } from '@/user/user.service';

interface KakaoProfileJson {
  kakao_account: { email: string };
  properties?: { profile_image?: string };
}

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('oauth.kakao.clientId'),
      clientSecret: configService.getOrThrow<string>('oauth.kakao.clientSecret'),
      callbackURL: configService.getOrThrow<string>('oauth.kakao.callbackUrl'),
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
    const providerId = profile.id;
    const { kakao_account, properties } = profile._json as KakaoProfileJson;

    const email = kakao_account?.email;
    if (!email) {
      throw new MissingSocialEmailException();
    }

    const existingUser = await this.userService.findUserBySocialAccount('kakao', providerId);
    if (existingUser) {
      return existingUser;
    }

    const input: CreateSocialUserInput = {
      provider: 'kakao',
      providerId,
      email,
      name: profile.displayName,
      profileIcon: properties?.profile_image,
      socialRefreshToken: refreshToken,
    };

    return await this.userService.createSocialUser(input);
  }
}
