import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import {
  RequestEmailTokenDto,
  SendVerificationEmailResponseDto,
  VerifyEmailTokenResponseDto,
} from '@/auth/dto/email-token.dto';
import { EmailService } from '@/auth/email.service';
import { TokenService } from '@/auth/token.service';
import { SendVerificationEmailInput } from '@/auth/types/auth-service.types';

@Controller('auth/email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
  ) {}

  @Post()
  async sendVerificationEmail(
    @Body() requestEmailTokenDto: RequestEmailTokenDto,
  ): Promise<SendVerificationEmailResponseDto> {
    const input: SendVerificationEmailInput = { email: requestEmailTokenDto.email };
    await this.emailService.sendVerificationEmail(input);
    return { message: '이메일 인증 링크가 전송되었습니다.' };
  }

  @Get()
  async verifyEmailToken(@Query('token') token: string): Promise<VerifyEmailTokenResponseDto> {
    const email = await this.tokenService.verifyEmailVerificationToken(token);
    return {
      message: '이메일 인증이 완료되었습니다.',
      email,
    };
  }
}
