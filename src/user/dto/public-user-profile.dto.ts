import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

import { UserRole } from '@/types/user.types';

export class PublicUserProfileDto {
  @ApiProperty({ description: '닉네임', example: 'mr.john' })
  @IsString()
  name: string;

  @ApiProperty({ description: '이메일 주소', example: 'example@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '프로필 아이콘 이미지 링크', example: 'https://img/example.jpg' })
  @IsString()
  profileIcon: string;

  @ApiProperty({ description: '사용자 ID', example: 'johndoe123' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'role 속성, user와 admin이 있습니다.', example: 'user' })
  @IsString()
  role: UserRole;
}
