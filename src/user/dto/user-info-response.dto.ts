import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

import { UserRole } from '@/types/user.types';

export class UserInfoResponseDto {
  @ApiProperty({ description: '닉네임', example: 'mr.john' })
  @IsString()
  name: string;

  @ApiProperty({ description: '이메일 주소', example: 'example@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '사용자 ID', example: 'johndoe123' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ description: '프로필 아이콘 이미지 URL', example: 'https://img/example.jpg' })
  @IsString()
  profileIcon: string;

  @ApiProperty({ description: 'role 속성, user와 admin이 있습니다.', example: 'user' })
  @IsString()
  role: UserRole;

  @ApiProperty({ description: '회원가입 날짜', example: '2025-04-16T00:00:00.000Z' })
  @IsOptional()
  createdAt?: Date;
}
