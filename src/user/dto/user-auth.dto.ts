import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).+$/, {
    message: '비밀번호는 대소문자, 특수문자, 숫자를 각각 포함해야 합니다.',
  })
  newPassword: string;
}
