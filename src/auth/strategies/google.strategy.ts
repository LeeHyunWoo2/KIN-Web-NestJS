import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { FastifyRequest } from 'fastify';
import { Profile, Strategy } from 'passport-google-oauth20';

import { MissingSocialEmailException } from '@/common/exceptions/auth.exceptions';
import { AccessTokenPayload } from '@/types/user.types';
import { UserService } from '@/user/user.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      clientID: config.getOrThrow<string>('oauth.google.clientId'),
      clientSecret: config.getOrThrow<string>('oauth.google.clientSecret'),
      callbackURL: config.getOrThrow<string>('oauth.google.callbackUrl'),
      passReqToCallback: true,
      scope: ['profile', 'email'],
    });
  }

  async validate(
    req: FastifyRequest,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<AccessTokenPayload> {
    const providerId = profile.id;

    if (!profile.emails?.[0]?.value) {
      throw new MissingSocialEmailException();
    }

    const existingUser = await this.userService.findUserBySocialAccount('google', providerId);
    if (existingUser) {
      return existingUser;
    }

    return await this.userService.createSocialUser({
      provider: 'google',
      providerId,
      email: profile.emails[0].value,
      name: profile.displayName,
      profileIcon: profile.photos?.[0].value,
      socialRefreshToken: refreshToken,
    });
  }
}
