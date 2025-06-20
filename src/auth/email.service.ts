import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import { TokenService } from '@/auth/token.service';
import { SendVerificationEmailInput } from '@/auth/types/auth-service.types';
import { LogExecutionTime } from '@/common/decorators/log-execution-time.decorator';
import { EmailSendFailedException } from '@/common/exceptions';

@Injectable()
export class EmailService {
  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
  ) {}

  @LogExecutionTime()
  async sendVerificationEmail(input: SendVerificationEmailInput): Promise<void> {
    const { email } = input;
    const token = this.tokenService.generateEmailVerificationToken(email);

    const verificationUrl = `${this.configService.getOrThrow<string>('app.frontendOrigin')}/verify-email?token=${token}`;

    if (this.configService.get<string>('app.nodeEnv') === 'test') {
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: this.configService.getOrThrow<string>('mail.user'),
        pass: this.configService.getOrThrow<string>('mail.password'),
      },
    });

    const mailOptions = {
      from: this.configService.getOrThrow<string>('mail.user'),
      to: email,
      subject: '이메일 인증 요청',
      text: `
Keep Idea Note 에서 인증 요청을 하셨나요?

본인의 인증 요청이 맞다면 다음 링크를 클릭하여 이메일 인증을 완료하실 수 있습니다.

${verificationUrl}`,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch {
      throw new EmailSendFailedException();
    }
  }
}
