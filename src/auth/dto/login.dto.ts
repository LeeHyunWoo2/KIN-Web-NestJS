import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: '사용자 ID', example: 'johndoe123' })
  @IsString()
  @MinLength(6, { message: '아이디는 최소 6자 이상이어야 합니다.' })
  username: string;

  @ApiProperty({ description: '비밀번호', example: 'StrongP@ssw0rd!' })
  @IsString()
  @MinLength(1, { message: '비밀번호를 입력해주세요. ' })
  password: string;

  @ApiProperty({ description: '자동 로그인 여부 플래그', example: true })
  @IsBoolean()
  rememberMe: boolean;
}
