import { IsEmail, IsOptional, IsString } from 'class-validator';

import { UserRole } from '@/types/user.types';

export class UserInfoDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsString()
  profileIcon: string;

  @IsString()
  role: UserRole;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}

export class UserInfoResponseDto {
  user: UserInfoDto;
}
