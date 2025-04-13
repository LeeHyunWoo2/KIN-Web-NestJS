import { IsEmail, IsOptional, IsString } from 'class-validator';

export class FindUserSuccessResponseDto {
  @IsString()
  signal: 'user_found';

  @IsString()
  accountType: 'Local' | 'SNS';

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class FindUserFailureResponseDto {
  @IsString()
  signal: 'user_not_found';
}
