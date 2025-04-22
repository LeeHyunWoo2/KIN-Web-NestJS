import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { FastifyRequest } from 'fastify';
import { Profile, Strategy, StrategyOptionWithRequest } from 'passport-naver';

import { AccessTokenPayload } from '@/types/user.types';
import { UserService } from '@/user/user.service';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(
    config: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      clientID: config.getOrThrow<string>('oauth.naver.clientId'),
      clientSecret: config.getOrThrow<string>('oauth.naver.clientSecret'),
      callbackURL: config.getOrThrow<string>('oauth.naver.callbackUrl'),
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

    const existingUser = await this.userService.findUserBySocialAccount('naver', providerId);
    if (existingUser) {
      return existingUser;
    }

    return await this.userService.createSocialUser({
      provider: 'naver',
      providerId,
      email: profile._json.email,
      name: profile.displayName,
      profileIcon: profile._json.profile_image,
      socialRefreshToken: refreshToken,
    });
  }
}
