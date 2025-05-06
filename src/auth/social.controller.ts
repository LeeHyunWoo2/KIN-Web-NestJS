import { Controller, Delete, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FastifyReply, FastifyRequest } from 'fastify';

import { AccessGuard } from '@/auth/access.guard';
import { SocialService } from '@/auth/social.service';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { DecodedUser } from '@/types/user.types';

@Controller('auth/social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin(): Promise<void> {}

  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  async kakaoLogin(): Promise<void> {}

  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  async naverLogin(): Promise<void> {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const { error, user } = req.authResult || {};
    return this.socialService.handleSocialCallbackResult(user, reply, error);
  }

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoCallback(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const { error, user } = req.authResult || {};
    return this.socialService.handleSocialCallbackResult(user, reply, error);
  }

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  async naverCallback(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const { error, user } = req.authResult || {};
    return this.socialService.handleSocialCallbackResult(user, reply, error);
  }

  @Get('link/google')
  @UseGuards(AccessGuard, AuthGuard('google-link'))
  async linkGoogle(): Promise<void> {}

  @Get('link/kakao')
  @UseGuards(AccessGuard, AuthGuard('kakao-link'))
  async linkKakao(): Promise<void> {}

  @Get('link/naver')
  @UseGuards(AccessGuard, AuthGuard('naver-link'))
  async linkNaver(): Promise<void> {}

  @Get('link/google/callback')
  @UseGuards(AccessGuard, AuthGuard('google-link'))
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
  async unlinkSocial(
    @CurrentUserDecorator() user: DecodedUser,
    @Param('provider') provider: 'google' | 'kakao' | 'naver',
  ): Promise<void> {
    await this.socialService.unlinkSocialAccount(user.id, provider);
  }
}
