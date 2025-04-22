import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

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
