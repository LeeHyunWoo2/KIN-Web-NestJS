import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { FastifyReply } from 'fastify';
import { Model } from 'mongoose';

import { TokenService } from '@/auth/token.service';
import { setAuthCookies } from '@/auth/utils/set-auth-cookies.util';
import { AlreadyLinkedException } from '@/common/exceptions/auth.exceptions';
import {
  NoRemainingAuthMethodException,
  UserNotFoundException,
} from '@/common/exceptions/user.exceptions';
import { AccessTokenPayload, PassportAuthResultError } from '@/types/user.types';
import { User, UserDocument } from '@/user/schemas/user.schema';

@Injectable()
export class SocialService {
  constructor(
    private readonly config: ConfigService,
    private readonly tokenService: TokenService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async handleSocialCallbackResult(
    user: AccessTokenPayload | undefined,
    reply: FastifyReply,
    error?: PassportAuthResultError,
  ): Promise<void> {
    const frontendOrigin = this.config.getOrThrow<string>('app.frontendOrigin');

    if (!user) {
      reply.redirect(`${frontendOrigin}/login`);
      return;
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      reply.redirect(
        `${frontendOrigin}/login?error=${encodeURIComponent('해당 이메일로 가입된 계정이 있습니다.')}`,
      );
      return;
    }
    const refreshTokenTtl = this.config.getOrThrow<number>('auth.refreshTokenTtl');
    const tokens = await this.tokenService.generateTokens(user, refreshTokenTtl);

    setAuthCookies(reply, tokens);
    reply.redirect(`${frontendOrigin}/loginSuccess`);
  }

  async redirectAfterLink(
    reply: FastifyReply,
    error: PassportAuthResultError,
    successPath: '/userinfo',
    failureMessage: '이미 연동된 계정입니다.',
  ): Promise<void> {
    const frontendOrigin = this.config.getOrThrow<string>('app.frontendOrigin');
    const isAlreadyLinkedError = error instanceof AlreadyLinkedException;

    const query = isAlreadyLinkedError ? `?error=${encodeURIComponent(failureMessage)}` : '';
    const target = `${frontendOrigin}${successPath}${query}`;

    await reply.redirect(target);
  }

  async unlinkSocialAccount(userId: string, provider: 'google' | 'kakao' | 'naver'): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }
    const accounts = user.socialAccounts.filter((acc) => acc.provider !== provider);

    if (accounts.length === 0) {
      throw new NoRemainingAuthMethodException();
    }
    const token = await this.tokenService.generateOAuthToken({
      user: { socialAccounts: user.socialAccounts },
      provider,
    });

    await this.revokeSocialAccess(provider, token);

    user.socialAccounts = accounts;
    await user.save();
  }

  private async revokeSocialAccess(
    provider: 'google' | 'kakao' | 'naver',
    token: string,
  ): Promise<void> {
    const axios = (await import('axios')).default;
    if (provider === 'google') {
      await axios.post(`https://oauth2.googleapis.com/revoke?token=${token}`);
    } else if (provider === 'kakao') {
      await axios.post('https://kapi.kakao.com/v1/user/unlink', null, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } else if (provider === 'naver') {
      await axios.post('https://nid.naver.com/oauth2.0/token', null, {
        params: {
          grant_type: 'delete',
          client_id: this.config.getOrThrow<string>('oauth.naver.clientId'),
          client_secret: this.config.getOrThrow<string>('oauth.naver.clientSecret'),
          access_token: token,
        },
      });
    }
  }
}
