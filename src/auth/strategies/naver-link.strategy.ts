import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { FastifyRequest } from 'fastify';
import { Profile, Strategy } from 'passport-naver';

import { AlreadyLinkedException } from '@/common/exceptions/auth.exceptions';
import { AccessTokenMissingException } from '@/common/exceptions/token.exceptions';
import { UserNotFoundException } from '@/common/exceptions/user.exceptions';
import { AccessTokenPayload } from '@/types/user.types';
import { SocialAccount } from '@/user/entity/social-account.entity';
import { User } from '@/user/entity/user.entity';

@Injectable()
export class NaverLinkStrategy extends PassportStrategy(Strategy, 'naver-link') {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @InjectRepository(SocialAccount)
    private readonly socialAccountRepository: EntityRepository<SocialAccount>,
  ) {
    super({
      clientID: configService.getOrThrow<string>('oauth.naver.clientId'),
      clientSecret: configService.getOrThrow<string>('oauth.naver.clientSecret'),
      callbackURL: configService.getOrThrow<string>('oauth.naver.linkCallbackUrl'),
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
      provider: 'naver',
      providerId,
    });

    if (alreadyLinked) {
      throw new AlreadyLinkedException();
    }

    const input = this.socialAccountRepository.create({
      user,
      provider: 'naver',
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
