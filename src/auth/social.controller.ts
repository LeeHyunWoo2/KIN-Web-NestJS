import { Controller, Delete, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FastifyReply, FastifyRequest } from 'fastify';

import { AccessGuard } from '@/auth/access.guard';
import { SocialService } from '@/auth/social.service';
import {
  DecodedUser,
  RedirectAfterLinkInput,
  SocialCallbackInput,
  UnlinkSocialAccountInput,
} from '@/auth/types/auth-service.types';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';

@Controller('auth/social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  /*
    ----- 소셜 로그인 시작 -----
  */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin(): Promise<void> {}

  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  async kakaoLogin(): Promise<void> {}

  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  async naverLogin(): Promise<void> {}

  /*
    ----- 소셜 로그인 콜백-----
  */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const input: SocialCallbackInput = {
      user: req.authResult?.user,
      error: req.authResult?.error,
      reply,
    };
    return this.socialService.handleSocialCallbackResult(input);
  }

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoCallback(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const input: SocialCallbackInput = {
      user: req.authResult?.user,
      error: req.authResult?.error,
      reply,
    };
    return this.socialService.handleSocialCallbackResult(input);
  }

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  async naverCallback(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const input: SocialCallbackInput = {
      user: req.authResult?.user,
      error: req.authResult?.error,
      reply,
    };
    return this.socialService.handleSocialCallbackResult(input);
  }

  /*
    ----- 소셜 연동 시작 -----
  */
  @Get('link/google')
  @UseGuards(AccessGuard, AuthGuard('google-link'))
  async linkGoogle(): Promise<void> {}

  @Get('link/kakao')
  @UseGuards(AccessGuard, AuthGuard('kakao-link'))
  async linkKakao(): Promise<void> {}

  @Get('link/naver')
  @UseGuards(AccessGuard, AuthGuard('naver-link'))
  async linkNaver(): Promise<void> {}

  /*
    ----- 소셜 연동 콜백 -----
  */
  @Get('link/google/callback')
  @UseGuards(AccessGuard, AuthGuard('google-link'))
  async linkGoogleCallback(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const input: RedirectAfterLinkInput = {
      error: req.authResult?.error,
      reply,
    };
    await this.socialService.redirectAfterLink(input);
  }

  @Get('link/kakao/callback')
  @UseGuards(AccessGuard, AuthGuard('kakao-link'))
  async linkKakaoCallback(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const input: RedirectAfterLinkInput = {
      error: req.authResult?.error,
      reply,
    };
    await this.socialService.redirectAfterLink(input);
  }

  @Get('link/naver/callback')
  @UseGuards(AccessGuard, AuthGuard('naver-link'))
  async linkNaverCallback(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const input: RedirectAfterLinkInput = {
      error: req.authResult?.error,
      reply,
    };
    await this.socialService.redirectAfterLink(input);
  }

  /*
    ----- 소셜 연동 해제 -----
  */
  @Delete(':provider')
  @UseGuards(AccessGuard)
  async unlinkSocial(
    @CurrentUserDecorator() user: DecodedUser,
    @Param('provider') provider: 'google' | 'kakao' | 'naver',
  ): Promise<void> {
    const input: UnlinkSocialAccountInput = {
      id: user.id,
      provider,
    };
    await this.socialService.unlinkSocialAccount(input);
  }
}
