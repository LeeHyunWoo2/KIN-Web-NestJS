import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

import { EmailTokenPayload } from '@/types/user.types';
import { UserSnapshot } from '@/types/user.types';

type EmailField = Pick<UserSnapshot, 'email'>;

export class RequestEmailTokenDto implements EmailField {
  @ApiProperty({
    description: '이메일 주소',
    example: 'example@example.com',
  })
  @IsEmail()
  email: string;
}

export class SendVerificationEmailResponseDto {
  @ApiProperty({
    description: '응답 메시지',
    example: '이메일 인증 링크가 전송되었습니다.',
  })
  message: string;
}

export class VerifyEmailTokenResponseDto {
  @ApiProperty({
    description: '응답 메시지',
    example: '이메일 인증이 완료되었습니다.',
  })
  message: string;

  @ApiProperty({
    description: '인증된 이메일 주소',
    example: 'user@example.com',
  })
  email: EmailTokenPayload;
}
