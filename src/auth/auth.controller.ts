import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

import { AccessGuard } from '@/auth/access.guard';
import { AuthService } from '@/auth/auth.service';
import { LoginDto, RegisterDto } from '@/auth/dto/auth.dto';
import { SetAuthCookiesInterceptor } from '@/auth/interceptor/set-auth-cookies.interceptor';
import { TokenService } from '@/auth/token.service';
import {
  CreateUserInput,
  DecodedUser,
  LoginUserInput,
  TokenPair,
} from '@/auth/types/auth-service.types';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { RefreshToken } from '@/common/decorators/refresh-token.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<void> {
    const input: CreateUserInput = {
      username: registerDto.username,
      email: registerDto.email,
      password: registerDto.password,
      name: registerDto.name,
      marketingConsent: registerDto.marketingConsent,
    };

    await this.authService.registerUser(input);
  }

  @Post('login')
  @HttpCode(200)
  @UseInterceptors(SetAuthCookiesInterceptor)
  async login(@Body() loginDto: LoginDto): Promise<TokenPair> {
    const input: LoginUserInput = {
      username: loginDto.username,
      password: loginDto.password,
      rememberMe: loginDto.rememberMe,
    };

    return await this.authService.loginUser(input);
  }

  @Post('logout')
  @UseGuards(AccessGuard)
  @HttpCode(204)
  async logout(
    @RefreshToken() refreshToken: string,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const accessToken = req.cookies?.accessToken;

    if (refreshToken) {
      try {
        const { id } = await this.tokenService.verifyRefreshToken(refreshToken);
        await this.tokenService.deleteRefreshTokenFromRedis(id);
      } catch {
        // 무시하고 진행 (Redis 로직 실패와 상관없이 진행되어야 함)
      }
    }

    if (accessToken) {
      await this.tokenService.invalidateAccessToken(accessToken);
    }

    // 토큰이 유효하지 않더라도 로그아웃 처리를 위해 쿠키는 항상 제거함
    reply.clearCookie('accessToken');
    reply.clearCookie('refreshToken');
  }

  @UseInterceptors(SetAuthCookiesInterceptor)
  @Post('refresh')
  async refresh(@RefreshToken() refreshToken: string): Promise<TokenPair> {
    return await this.authService.refreshTokens(refreshToken);
  }

  @Get('session')
  @UseGuards(AccessGuard)
  checkSession(@CurrentUserDecorator() user: DecodedUser): DecodedUser {
    return user;
  }
}
