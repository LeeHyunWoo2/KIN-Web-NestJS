import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class FindUserDto {
  @IsString()
  @MinLength(6)
  input: string;

  @IsIn(['username', 'email'])
  inputType: 'username' | 'email';

  @IsBoolean()
  fetchUsername: boolean;
}

export class FindUserResultDto {
  @IsString()
  signal: 'user_found' | 'user_not_found';

  @IsString()
  accountType?: 'Local' | 'SNS';

  @IsOptional()
  @IsString()
  @MinLength(6)
  username?: string;

  @IsEmail()
  email?: string;
}
