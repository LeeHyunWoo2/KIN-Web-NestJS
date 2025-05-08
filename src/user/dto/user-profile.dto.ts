import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

import { UserRole } from '@/types/user.types';

class BaseUserProfileDto {
  @ApiProperty({ description: '닉네임', example: 'mr.john' })
  @IsString()
  name: string;

  @ApiProperty({ description: '이메일 주소', example: 'example@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '프로필 아이콘 이미지 URL',
    example: 'https://img.example.com/icon.jpg',
  })
  @IsString()
  profileIcon: string;

  @ApiProperty({ description: '유저 역할 (user | admin)', example: 'user' })
  @IsString()
  role: UserRole;
}

export class PublicUserProfileDto extends BaseUserProfileDto {
  @ApiProperty({ description: '유저 고유 ID (PK)', example: 123 })
  @Type(() => Number)
  @IsNumber()
  id: number;
}

export class UserInfoResponseDto extends BaseUserProfileDto {
  @ApiProperty({ description: '사용자 ID', example: 'johndoe123' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ description: '가입일자', example: '2025-05-08T00:00:00.000Z' })
  @IsOptional()
  createdAt?: Date;
}

export class UpdateUserDto {
  @ApiProperty({ description: '변경할 닉네임', example: 'mr.john2' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiProperty({
    description: '변경할 프로필 이미지 URL',
    example: 'https://img.example.com/new.jpg',
  })
  @IsOptional()
  @IsString()
  profileIcon?: string;
}

export class AddLocalAccountDto {
  @ApiProperty({ description: '사용자 ID', example: 'johndoe123' })
  @IsString()
  @MinLength(6)
  username: string;

  @ApiProperty({ description: '이메일 주소', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '비밀번호', example: 'StrongP@ssw0rd!' })
  @IsString()
  @MinLength(8)
  password: string;
}
