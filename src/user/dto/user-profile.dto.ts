import { Type } from 'class-transformer';
import { IsEmail, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

import { UserRole } from '@/types/user-entity.types';

class BaseUserProfileDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  profileIcon: string;

  @IsString()
  role: UserRole;
}

export class PublicUserProfileDto extends BaseUserProfileDto {
  @Type(() => Number)
  @IsNumber()
  id: number;
}

export class UserInfoResponseDto extends BaseUserProfileDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  createdAt?: Date;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  profileIcon?: string;
}

export class AddLocalAccountDto {
  @IsString()
  @MinLength(6)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
