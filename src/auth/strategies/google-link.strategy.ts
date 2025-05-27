import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { FastifyRequest } from 'fastify';
import { Profile, Strategy } from 'passport-google-oauth20';

import { AccessTokenPayload } from '@/auth/types/auth-service.types';
import { AlreadyLinkedException } from '@/common/exceptions/auth.exceptions';
import { AccessTokenMissingException } from '@/common/exceptions/token.exceptions';
import { UserNotFoundException } from '@/common/exceptions/user.exceptions';
import { SocialAccount } from '@/user/entity/social-account.entity';
import { User } from '@/user/entity/user.entity';

@Injectable()
export class GoogleLinkStrategy extends PassportStrategy(Strategy, 'google-link') {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @InjectRepository(SocialAccount)
    private readonly socialAccountRepository: EntityRepository<SocialAccount>,
  ) {
    super({
      clientID: configService.getOrThrow<string>('oauth.google.clientId'),
      clientSecret: configService.getOrThrow<string>('oauth.google.clientSecret'),
      callbackURL: configService.getOrThrow<string>('oauth.google.linkCallbackUrl'),
      passReqToCallback: true,
    });
  }

  async validate(
    req: FastifyRequest,
    _accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<AccessTokenPayload> {
    const id = (req.user as AccessTokenPayload)?.id;
    if (!id) {
      throw new AccessTokenMissingException();
    }

    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new UserNotFoundException();
    }

    const providerId = profile.id;

    const alreadyLinked = await this.socialAccountRepository.findOne({
      provider: 'google',
      providerId,
    });

    if (alreadyLinked) {
      throw new AlreadyLinkedException();
    }

    const input = this.socialAccountRepository.create({
      user,
      provider: 'google',
      providerId: providerId,
      socialRefreshToken: refreshToken,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.socialAccountRepository.getEntityManager().persistAndFlush(input);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
