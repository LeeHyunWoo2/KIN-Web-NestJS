import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TokenService } from '@/auth/token.service';
import {
  RedirectAfterLinkInput,
  SocialCallbackInput,
  TokenPair,
  UnlinkSocialAccountInput,
} from '@/auth/types/auth-service.types';
import { setAuthCookies } from '@/auth/utils/set-auth-cookies.util';
import { LogExecutionTime } from '@/common/decorators/log-execution-time.decorator';
import {
  AlreadyLinkedException,
  NoRemainingAuthMethodException,
  UserNotFoundException,
} from '@/common/exceptions';
import { SocialAccount } from '@/user/entity/social-account.entity';
import { User } from '@/user/entity/user.entity';

@Injectable()
export class SocialService {
  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @InjectRepository(SocialAccount)
    private readonly socialAccountRepository: EntityRepository<SocialAccount>,
  ) {}

  @LogExecutionTime()
  async handleSocialCallbackResult(input: SocialCallbackInput): Promise<void> {
    const { reply, error, user } = input;
    const frontendOrigin = this.configService.getOrThrow<string>('app.frontendOrigin');

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
    const refreshTokenTtl = this.configService.getOrThrow<number>('auth.refreshTokenTtl');
    const tokens: TokenPair = await this.tokenService.generateTokens(user, refreshTokenTtl);

    setAuthCookies({ reply, tokens });
    reply.redirect(`${frontendOrigin}/loginSuccess`);
  }

  @LogExecutionTime()
  async redirectAfterLink(input: RedirectAfterLinkInput): Promise<void> {
    const { reply, error } = input;
    const frontendOrigin = this.configService.getOrThrow<string>('app.frontendOrigin');
    const successPath = this.configService.getOrThrow<string>('oauth.socialLinkRedirectUrl');

    const failureMessage =
      error instanceof AlreadyLinkedException ? error.message : '소셜 연동에 실패했습니다.';

    const query = `?error=${encodeURIComponent(failureMessage)}`;
    const target = `${frontendOrigin}${successPath}${query}`;

    await reply.redirect(target);
  }

  @LogExecutionTime()
  async unlinkSocialAccount(input: UnlinkSocialAccountInput): Promise<void> {
    const { id, provider } = input;
    const user = await this.userRepository.findOne(id, {
      fields: ['id'],
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    const remainingAccounts = await this.socialAccountRepository.find({
      user,
      provider: { $ne: provider },
    });

    if (remainingAccounts.length === 0) {
      throw new NoRemainingAuthMethodException();
    }

    const account = await this.socialAccountRepository.findOne({
      user,
      provider,
    });
    if (account) {
      const token = await this.tokenService.generateOAuthToken({
        user: {
          socialAccounts: [
            {
              provider: account.provider,
              providerId: account.providerId,
            },
          ],
        },
        provider,
      });

      await this.revokeSocialAccess(provider, token);

      await this.socialAccountRepository.getEntityManager().removeAndFlush(account);
    }
  }

  private async revokeSocialAccess(
    provider: 'google' | 'kakao' | 'naver',
    token: string,
  ): Promise<void> {
    if (this.configService.get<string>('app.nodeEnv') === 'test') {
      return;
    }
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
          client_id: this.configService.getOrThrow<string>('oauth.naver.clientId'),
          client_secret: this.configService.getOrThrow<string>('oauth.naver.clientSecret'),
          access_token: token,
        },
      });
    }
  }
}
