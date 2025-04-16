import { IsEmail, IsOptional, IsString } from 'class-validator';

export class FindUserResultDto {
  @IsString()
  signal: 'user_found' | 'user_not_found';

  @IsString()
  accountType?: 'Local' | 'SNS';

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
