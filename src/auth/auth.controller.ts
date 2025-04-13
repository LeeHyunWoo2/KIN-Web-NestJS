import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

import { AuthGuard } from '@/auth/auth.guard';
import { AuthService } from '@/auth/auth.service';
import { LoginDto } from '@/auth/dto/login.dto';
import { RegisterDto } from '@/auth/dto/register.dto';
import { TokenService } from '@/auth/services/token.service';
import { setAuthCookies } from '@/auth/utils/set-auth-cookies.util';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import {
  CreateUserInput,
  DecodedUser,
  LoginUserInput,
  RefreshTokenPayload,
  TokenPair,
} from '@/types/user.types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: '회원가입 (로컬) ' })
  async register(@Body() dto: RegisterDto): Promise<void> {
    const input: CreateUserInput = {
      username: dto.username,
      email: dto.email,
      password: dto.password,
      name: dto.name,
      marketingConsent: dto.marketingConsent,
    };

    await this.authService.registerUser(input);
  }

  @Post('login')
  @ApiOperation({ summary: '로그인 (로컬) ' })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    schema: {
      example: {
        success: true,
      },
    },
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ success: boolean }> {
    const tokens = await this.authService.loginUser(loginDto as LoginUserInput);

    // TODO: as unknown as 제거하기
    setAuthCookies(reply, tokens as unknown as TokenPair);
    return { success: true };
  }

  @Post('logout')
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({
    status: 200,
    description: '쿠키 삭제 후 로그아웃 처리',
    schema: {
      example: {},
    },
  })
  async logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      const decoded = jwt.decode(refreshToken) as RefreshTokenPayload;
      await this.tokenService.deleteRefreshTokenFromRedis(decoded.id);
    }

    if (accessToken) {
      await this.tokenService.invalidateAccessToken(accessToken);
    }

    reply.clearCookie('accessToken');
    reply.clearCookie('refreshToken');
  }

  @Post('refresh')
  @ApiOperation({ summary: 'AccessToken 재발급' })
  @ApiResponse({ status: 200, description: '리프레시 토큰을 통해 새 AccessToken 발급' })
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);
    setAuthCookies(reply, tokens);
  }

  @Get('session')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'AccessToken 기반 세션 확인' })
  @ApiResponse({
    status: 200,
    description: 'AccessToken이 유효하면 사용자 기본 정보 반환',
    schema: {
      example: {
        user: {
          id: 'string',
          email: 'string',
          role: 'user | admin',
        },
      },
    },
  })
  checkSession(@CurrentUserDecorator() user: DecodedUser) {
    return { user };
  }
}
