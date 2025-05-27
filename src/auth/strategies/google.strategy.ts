import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { FastifyRequest } from 'fastify';
import { Profile, Strategy } from 'passport-google-oauth20';

import { AccessTokenPayload } from '@/auth/types/auth-service.types';
import { MissingSocialEmailException } from '@/common/exceptions/auth.exceptions';
import { CreateSocialUserInput } from '@/user/types/user-service.types';
import { UserService } from '@/user/user.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('oauth.google.clientId'),
      clientSecret: configService.getOrThrow<string>('oauth.google.clientSecret'),
      callbackURL: configService.getOrThrow<string>('oauth.google.callbackUrl'),
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

    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new MissingSocialEmailException();
    }

    const existingUser = await this.userService.findUserBySocialAccount('google', providerId);
    if (existingUser) {
      return existingUser;
    }

    const input: CreateSocialUserInput = {
      provider: 'google',
      providerId,
      email,
      name: profile.displayName,
      profileIcon: profile.photos?.[0]?.value,
      socialRefreshToken: refreshToken,
    };

    return await this.userService.createSocialUser(input);
  }
}
