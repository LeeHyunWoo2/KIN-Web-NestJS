import { ApiProperty } from '@nestjs/swagger';

import { EmailTokenPayload } from '@/types/user.types';

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
