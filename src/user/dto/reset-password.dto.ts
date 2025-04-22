import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: '이메일 주소', example: 'example@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '새로운 비밀번호', example: 'VeryStr0ngP@ssword!123~' })
  @IsString()
  newPassword: string;
}
