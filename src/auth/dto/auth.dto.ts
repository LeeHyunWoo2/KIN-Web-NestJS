import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: '사용자 ID', example: 'johndoe123' })
  @IsString()
  @MinLength(6, { message: '아이디는 최소 6자 이상이어야 합니다.' })
  username: string;

  @ApiProperty({ description: '비밀번호', example: 'StrongP@ssw0rd!' })
  @IsString()
  @MinLength(1, { message: '비밀번호를 입력해주세요.' })
  password: string;

  @ApiProperty({ description: '자동 로그인 여부 플래그', example: true })
  @IsBoolean()
  rememberMe: boolean;
}

export class RegisterDto {
  @ApiProperty({ description: '사용자 ID', example: 'johndoe123' })
  @IsString()
  @MinLength(6, { message: '아이디는 최소 6자 이상이어야 합니다.' })
  username: string;

  @ApiProperty({ description: '이메일 주소', example: 'example@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '비밀번호', example: 'StrongP@ssw0rd!' })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).+$/, {
    message: '비밀번호는 대소문자, 특수문자, 숫자를 각각 하나 이상 포함해야 합니다.',
  })
  password: string;

  @ApiProperty({ description: '닉네임', example: 'mr. John' })
  @IsString()
  @MinLength(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
  name: string;

  @ApiProperty({ description: '마케팅 수신 동의 여부', example: false })
  @IsBoolean()
  marketingConsent: boolean;
}
