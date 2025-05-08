import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class FindUserDto {
  @ApiProperty({ description: '입력값 (아이디 또는 이메일)', example: 'johndoe123' })
  @IsString()
  @MinLength(6)
  input: string;

  @ApiProperty({
    description: '검색 대상 유형',
    example: 'username',
    enum: ['username', 'email'],
  })
  @IsIn(['username', 'email'])
  inputType: 'username' | 'email';

  @ApiProperty({
    description: 'true면 아이디 찾기, false면 중복확인용',
    example: false,
  })
  @IsBoolean()
  fetchUsername: boolean;
}

export class FindUserResultDto {
  @ApiProperty({ description: '결과 플래그', example: 'user_found' })
  @IsString()
  signal: 'user_found' | 'user_not_found';

  @ApiProperty({ description: '계정 유형', example: 'Local' })
  @IsString()
  accountType?: 'Local' | 'SNS';

  @ApiProperty({ description: '아이디', example: 'johndoe123' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  username?: string;

  @ApiProperty({ description: '이메일 주소', example: 'example@example.com' })
  @IsEmail()
  email?: string;
}
