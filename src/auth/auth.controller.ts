import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';

import { AccessGuard } from '@/auth/access.guard';
import { AuthService } from '@/auth/auth.service';
import { LoginDto, RegisterDto } from '@/auth/dto/auth.dto';
import { TokenService } from '@/auth/token.service';
import { setAuthCookies } from '@/auth/utils/set-auth-cookies.util';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { RefreshToken } from '@/common/decorators/refresh-token.decorator';
import {
  AccessTokenMissingException,
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  RefreshTokenInvalidException,
  RefreshTokenMismatchException,
  RefreshTokenMissingException,
  RefreshTokenNotFoundException,
  UsernameAlreadyExistsException,
  UserNotFoundException,
} from '@/common/exceptions';
import { CreateUserInput, DecodedUser, LoginUserInput, TokenPair } from '@/types/user.types';

@ApiExtraModels(
  AccessTokenMissingException,
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  RefreshTokenInvalidException,
  RefreshTokenMismatchException,
  RefreshTokenMissingException,
  RefreshTokenNotFoundException,
  UsernameAlreadyExistsException,
  UserNotFoundException,
)
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: '회원가입 (로컬)' })
  @ApiResponse({ status: 201, description: '회원가입 성공 (응답 본문 없음)' })
  @ApiResponse({
    status: 409,
    description: '이미 사용 중인 아이디',
    type: UsernameAlreadyExistsException,
  })
  @ApiResponse({
    status: 409,
    description: '이미 사용 중인 이메일',
    type: EmailAlreadyExistsException,
  })
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
  @ApiOperation({ summary: '로그인 (로컬)' })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '아이디 또는 비밀번호 불일치',
    type: InvalidCredentialsException,
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ success: boolean }> {
    const input: LoginUserInput = {
      username: loginDto.username,
      password: loginDto.password,
      rememberMe: loginDto.rememberMe,
    };

    const tokens: TokenPair = await this.authService.loginUser(input);

    setAuthCookies({ reply, tokens });
    return { success: true };
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({
    status: 200,
    description: '로그아웃 성공 (쿠키 제거, 응답 본문 없음)',
  })
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

  @Post('refresh')
  @ApiOperation({ summary: 'AccessToken 재발급' })
  @ApiResponse({
    status: 200,
    description: 'AccessToken 재발급 성공 (응답 본문 없음)',
  })
  @ApiResponse({
    status: 401,
    description: '리프레시 토큰 누락',
    type: RefreshTokenMissingException,
  })
  @ApiResponse({
    status: 401,
    description: '리프레시 토큰이 유효하지 않음',
    type: RefreshTokenInvalidException,
  })
  @ApiResponse({
    status: 401,
    description: '저장된 리프레시 토큰이 없음',
    type: RefreshTokenNotFoundException,
  })
  @ApiResponse({
    status: 401,
    description: '저장된 토큰과 일치하지 않음',
    type: RefreshTokenMismatchException,
  })
  async refresh(
    @RefreshToken() refreshToken: string,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const tokens: TokenPair = await this.authService.refreshTokens(refreshToken);
    setAuthCookies({ reply, tokens });
  }

  @Get('session')
  @UseGuards(AccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'AccessToken 기반 세션 확인' })
  @ApiResponse({
    status: 200,
    description: 'AccessToken이 유효하면 사용자 기본 정보 반환',
    schema: {
      example: {
        id: 1234567890,
        email: 'user@example.com',
        role: 'user',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'AccessToken 누락 또는 무효',
    type: AccessTokenMissingException,
  })
  checkSession(@CurrentUserDecorator() user: DecodedUser): DecodedUser {
    return user;
  }
}
