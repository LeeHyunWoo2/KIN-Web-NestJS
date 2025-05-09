import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiExtraModels, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  RequestEmailTokenDto,
  SendVerificationEmailResponseDto,
  VerifyEmailTokenResponseDto,
} from '@/auth/dto/email-token.dto';
import { EmailService } from '@/auth/email.service';
import { TokenService } from '@/auth/token.service';
import { EmailSendFailedException, InvalidEmailTokenException } from '@/common/exceptions';
import { SendVerificationEmailInput } from '@/types/user.types';

@ApiExtraModels(EmailSendFailedException, InvalidEmailTokenException)
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
    description: '이메일 전송 성공',
    type: SendVerificationEmailResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: '메일 전송 실패 (서버 오류)',
    type: EmailSendFailedException,
  })
  async sendVerificationEmail(
    @Body() requestEmailTokenDto: RequestEmailTokenDto,
  ): Promise<SendVerificationEmailResponseDto> {
    const input: SendVerificationEmailInput = { email: requestEmailTokenDto.email };
    await this.emailService.sendVerificationEmail(input);
    return { message: '이메일 인증 링크가 전송되었습니다.' };
  }

  @Get()
  @ApiOperation({ summary: '이메일 인증 토큰 검증' })
  @ApiQuery({
    name: 'token',
    required: true,
    description: '이메일 인증 토큰 (쿼리 파라미터)',
    example: '64KcIO2GoOyKpCDqsJzrsJzsnpDqsIAg65Cg6rGw7JW8...',
  })
  @ApiResponse({
    status: 200,
    description: '인증 성공',
    type: VerifyEmailTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '토큰이 유효하지 않음 또는 만료됨',
    type: InvalidEmailTokenException,
  })
  async verifyEmailToken(@Query('token') token: string): Promise<VerifyEmailTokenResponseDto> {
    const email = await this.tokenService.verifyEmailVerificationToken(token);
    return {
      message: '이메일 인증이 완료되었습니다.',
      email,
    };
  }
}
