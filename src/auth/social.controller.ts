import { Controller, Delete, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';

import { AccessGuard } from '@/auth/access.guard';
import { SocialService } from '@/auth/social.service';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { NoRemainingAuthMethodException, UserNotFoundException } from '@/common/exceptions';
import {
  DecodedUser,
  RedirectAfterLinkInput,
  SocialCallbackInput,
  UnlinkSocialAccountInput,
} from '@/types/user.types';

@ApiExtraModels(UserNotFoundException, NoRemainingAuthMethodException)
@ApiTags('Auth')
@Controller('auth/social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  /*
    ----- 소셜 로그인 시작 -----
  */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: '구글 로그인 시작 (리다이렉트)' })
  async googleLogin(): Promise<void> {}

  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  @ApiOperation({ summary: '카카오 로그인 시작 (리다이렉트)' })
  async kakaoLogin(): Promise<void> {}

  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  @ApiOperation({ summary: '네이버 로그인 시작 (리다이렉트)' })
  async naverLogin(): Promise<void> {}

  /*
    ----- 소셜 로그인 콜백-----
  */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: '구글 로그인 콜백 처리' })
  @ApiResponse({ status: 302, description: '로그인 성공 또는 실패 시 프론트로 리다이렉트' })
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
  @ApiOperation({ summary: '카카오 로그인 콜백 처리' })
  @ApiResponse({ status: 302, description: '로그인 성공 또는 실패 시 프론트로 리다이렉트' })
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
  @ApiOperation({ summary: '네이버 로그인 콜백 처리' })
  @ApiResponse({ status: 302, description: '로그인 성공 또는 실패 시 프론트로 리다이렉트' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: '구글 계정 연동 시작 (리다이렉트)' })
  async linkGoogle(): Promise<void> {}

  @Get('link/kakao')
  @UseGuards(AccessGuard, AuthGuard('kakao-link'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '카카오 계정 연동 시작 (리다이렉트)' })
  async linkKakao(): Promise<void> {}

  @Get('link/naver')
  @UseGuards(AccessGuard, AuthGuard('naver-link'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '네이버 계정 연동 시작 (리다이렉트)' })
  async linkNaver(): Promise<void> {}

  /*
    ----- 소셜 연동 콜백 -----
  */
  @Get('link/google/callback')
  @UseGuards(AccessGuard, AuthGuard('google-link'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '구글 계정 연동 콜백 처리' })
  @ApiResponse({ status: 302, description: '연동 성공 또는 실패 시 리다이렉트' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: '카카오 계정 연동 콜백 처리' })
  @ApiResponse({ status: 302, description: '연동 성공 또는 실패 시 리다이렉트' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: '네이버 계정 연동 콜백 처리' })
  @ApiResponse({ status: 302, description: '연동 성공 또는 실패 시 리다이렉트' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: '소셜 연동 해제 (google/kakao/naver)' })
  @ApiResponse({
    status: 200,
    description: '연동 해제 성공 (응답 본문 없음)',
  })
  @ApiResponse({
    status: 404,
    description: '유저를 찾을 수 없음',
    type: UserNotFoundException,
  })
  @ApiResponse({
    status: 400,
    description: '최소 하나 이상의 로그인 방식이 유지되어야 함',
    type: NoRemainingAuthMethodException,
  })
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
