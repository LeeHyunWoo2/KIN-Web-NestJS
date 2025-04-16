import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { FastifyRequest } from 'fastify';
import { Model } from 'mongoose';
import { Profile, Strategy } from 'passport-kakao';

import { AccessTokenPayload } from '@/types/user.types';
import { User, UserDocument } from '@/user/schemas/user.schema';

@Injectable()
export class KakaoLinkStrategy extends PassportStrategy(Strategy, 'kakao-link') {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    super({
      clientID: configService.getOrThrow<string>('oauth.kakao.clientId'),
      clientSecret: configService.getOrThrow<string>('oauth.kakao.clientSecret'),
      callbackURL: configService.getOrThrow<string>('oauth.kakao.linkCallbackUrl'),
      passReqToCallback: true,
    });
  }

  async validate(
    req: FastifyRequest,
    _accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<AccessTokenPayload> {
    const userId = (req.user as AccessTokenPayload)?.id;
    if (!userId) {
      throw new Error('로그인된 사용자만 소셜 연동이 가능합니다.');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    const providerId = profile.id;
    const alreadyLinked = user.socialAccounts.some(
      (acc) => acc.provider === 'kakao' && acc.providerId === providerId,
    );

    if (alreadyLinked) {
      throw { code: 11000 };
    }

    user.socialAccounts.push({
      provider: 'kakao',
      providerId,
      socialRefreshToken: refreshToken,
    });

    await user.save();

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
  }
}
