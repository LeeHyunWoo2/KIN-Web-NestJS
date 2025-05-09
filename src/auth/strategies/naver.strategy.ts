import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { FastifyRequest } from 'fastify';
import { Profile, Strategy, StrategyOptionWithRequest } from 'passport-naver';

import { MissingSocialEmailException } from '@/common/exceptions/auth.exceptions';
import { AccessTokenPayload, CreateSocialUserInput } from '@/types/user.types';
import { UserService } from '@/user/user.service';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('oauth.naver.clientId'),
      clientSecret: configService.getOrThrow<string>('oauth.naver.clientSecret'),
      callbackURL: configService.getOrThrow<string>('oauth.naver.callbackUrl'),
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
    const profileJson = profile._json as {
      email: string;
      profile_image?: string;
    };

    const email = profileJson?.email;
    if (!email) {
      throw new MissingSocialEmailException();
    }

    const profileIcon = profileJson?.profile_image;

    const existingUser = await this.userService.findUserBySocialAccount('naver', providerId);
    if (existingUser) {
      return existingUser;
    }

    const input: CreateSocialUserInput = {
      provider: 'naver',
      providerId,
      email,
      name: profile.displayName,
      profileIcon,
      socialRefreshToken: refreshToken,
    };

    return await this.userService.createSocialUser(input);
  }
}
