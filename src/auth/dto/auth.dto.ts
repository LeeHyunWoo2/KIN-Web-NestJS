import { IsBoolean, IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(6, { message: '아이디는 최소 6자 이상이어야 합니다.' })
  username: string;

  @IsString()
  @MinLength(1, { message: '비밀번호를 입력해주세요.' })
  password: string;

  @IsBoolean()
  rememberMe: boolean;
}

export class RegisterDto {
  @IsString()
  @MinLength(6, { message: '아이디는 최소 6자 이상이어야 합니다.' })
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).+$/, {
    message: '비밀번호는 대소문자, 특수문자, 숫자를 각각 하나 이상 포함해야 합니다.',
  })
  password: string;

  @IsString()
  @MinLength(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
  name: string;

  @IsBoolean()
  marketingConsent: boolean;
}
