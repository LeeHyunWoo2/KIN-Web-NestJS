import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsString } from 'class-validator';

import { UserSnapshot } from '@/types/user.types';

type RegisterFields = Pick<
  UserSnapshot,
  'username' | 'email' | 'password' | 'name' | 'marketingConsent'
>;

export class RegisterDto implements RegisterFields {
  @ApiProperty({ description: '사용자 ID', example: 'johndoe123' })
  @IsString()
  username: string;

  @ApiProperty({ description: '이메일 주소', example: 'example@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '비밀번호', example: 'StrongP@ssw0rd!' })
  @IsString()
  password: string;

  @ApiProperty({ description: '닉네임', example: 'mr. John' })
  @IsString()
  name: string;

  @ApiProperty({ description: '마케팅 수신 동의 여부', example: false })
  @IsBoolean()
  marketingConsent: boolean;
}
