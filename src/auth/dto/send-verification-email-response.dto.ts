import { ApiProperty } from '@nestjs/swagger';

export class SendVerificationEmailResponseDto {
  @ApiProperty({
    description: '응답 메시지',
    example: '이메일 인증 링크가 전송되었습니다.',
  })
  message: string;
}
