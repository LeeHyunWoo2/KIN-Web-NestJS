import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RequestEmailTokenDto } from '@/auth/dto/request-email-token.dto';
import { SendVerificationEmailResponseDto } from '@/auth/dto/send-verification-email-response.dto';
import { VerifyEmailTokenResponseDto } from '@/auth/dto/verify-email-token-response.dto';
import { EmailService } from '@/auth/email.service';
import { TokenService } from '@/auth/token.service';

@ApiTags('Auth')
@Controller('auth/email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
  ) {}

  @Post()
  @ApiOperation({ summary: '이메일 인증 링크 전송' })
  @ApiResponse({
    status: 200,
    description: '링크 전송 성공',
    type: SendVerificationEmailResponseDto,
  })
  async sendVerificationEmail(
    @Body() dto: RequestEmailTokenDto,
  ): Promise<SendVerificationEmailResponseDto> {
    await this.emailService.sendVerificationEmail(dto.email);
    return { message: '이메일 인증 링크가 전송되었습니다.' };
  }

  @Get()
  @ApiOperation({ summary: '이메일 인증 토큰 검증' })
  @ApiQuery({ name: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: '인증 성공',
    type: VerifyEmailTokenResponseDto,
  })
  async verifyEmailToken(@Query('token') token: string): Promise<VerifyEmailTokenResponseDto> {
    const email = await this.tokenService.verifyEmailVerificationToken(token);
    return {
      message: '이메일 인증이 완료되었습니다.',
      email,
    };
  }
}
