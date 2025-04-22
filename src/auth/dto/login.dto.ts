import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: '사용자 ID', example: 'johndoe123' })
  @IsString()
  username: string;

  @ApiProperty({ description: '비밀번호', example: 'StrongP@ssw0rd!' })
  @IsString()
  password: string;

  @ApiProperty({ description: '자동 로그인 여부 플래그', example: true })
  @IsBoolean()
  rememberMe: boolean;
}
