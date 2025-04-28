import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: '변경된 사용자 닉네임', example: 'mr.john2' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiProperty({
    description: '변경된 프로필 아이콘 이미지 URL',
    example: 'https://img/example2.jpg',
  })
  @IsOptional()
  @IsString()
  profileIcon?: string;
}
