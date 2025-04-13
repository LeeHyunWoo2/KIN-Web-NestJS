import { IsEmail, IsString } from 'class-validator';

import { UserRole } from '@/types/user.types';

export class PublicUserProfileDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  profileIcon: string;

  @IsString()
  userId: string;

  @IsString()
  role: UserRole;
}
