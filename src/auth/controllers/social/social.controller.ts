import { Controller, Delete, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { FastifyReply, FastifyRequest } from 'fastify';

import { AccessGuard } from '@/auth/access.guard';
import { SocialService } from '@/auth/services/social/social.service';
import { TokenService } from '@/auth/services/token/token.service';
import { CatchAndLog } from '@/common/decorators/catch-and-log.decorator';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { DecodedUser } from '@/types/user.types';

@Controller('auth/social')
export class SocialController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    private readonly socialService: SocialService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @CatchAndLog()
  async googleLogin(): Promise<void> {}

  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  @CatchAndLog()
  async kakaoLogin(): Promise<void> {}

  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  @CatchAndLog()
  async naverLogin(): Promise<void> {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @CatchAndLog()
  async googleCallback(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const { error, user } = req.authResult || {};
    return this.socialService.handleSocialCallbackResult(user, reply, error);
  }

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  @CatchAndLog()
  async kakaoCallback(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const { error, user } = req.authResult || {};
    return this.socialService.handleSocialCallbackResult(user, reply, error);
  }

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  @CatchAndLog()
  async naverCallback(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const { error, user } = req.authResult || {};
    return this.socialService.handleSocialCallbackResult(user, reply, error);
  }

  @Get('link/google')
  @UseGuards(AccessGuard, AuthGuard('google-link'))
  @CatchAndLog()
  async linkGoogle(): Promise<void> {}

  @Get('link/kakao')
  @UseGuards(AccessGuard, AuthGuard('kakao-link'))
  @CatchAndLog()
  async linkKakao(): Promise<void> {}

  @Get('link/naver')
  @UseGuards(AccessGuard, AuthGuard('naver-link'))
  @CatchAndLog()
  async linkNaver(): Promise<void> {}

  @Get('link/google/callback')
  @UseGuards(AccessGuard, AuthGuard('google-link'))
  @CatchAndLog()
  async linkGoogleCallback(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const { error } = req.authResult || {};
    await this.socialService.redirectAfterLink(
      reply,
      error,
      '/userinfo',
      '이미 연동된 계정입니다.',
    );
  }

  @Get('link/kakao/callback')
  @UseGuards(AccessGuard, AuthGuard('kakao-link'))
  @CatchAndLog()
  async linkKakaoCallback(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const { error } = req.authResult || {};
    await this.socialService.redirectAfterLink(
      reply,
      error,
      '/userinfo',
      '이미 연동된 계정입니다.',
    );
  }

  @Get('link/naver/callback')
  @UseGuards(AccessGuard, AuthGuard('naver-link'))
  @CatchAndLog()
  async linkNaverCallback(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const { error } = req.authResult || {};
    await this.socialService.redirectAfterLink(
      reply,
      error,
      '/userinfo',
      '이미 연동된 계정입니다.',
    );
  }

  @Delete('google')
  @Delete('kakao')
  @Delete('naver')
  @UseGuards(AccessGuard)
  @CatchAndLog()
  async unlinkSocial(
    @CurrentUserDecorator() user: DecodedUser,
    @Param('provider') provider: 'google' | 'kakao' | 'naver',
  ): Promise<void> {
    await this.socialService.unlinkSocialAccount(user.id, provider);
  }
}
