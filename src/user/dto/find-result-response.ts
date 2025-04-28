import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class FindUserResultDto {
  @ApiProperty({
    description:
      '해당 유저가 존재하는지 확인하는 플래그, 회원가입 중복검사 및 아이디 찾기에서 사용됩니다.',
    example: 'user_found',
  })
  @IsString()
  signal: 'user_found' | 'user_not_found';

  @ApiProperty({
    description: '해당 아이디의 계정 타입. 일반 계정은 Local, 소셜 계정이면 SNS 로 표기됩니다.',
    example: 'Local',
  })
  @IsString()
  accountType?: 'Local' | 'SNS';

  @ApiProperty({
    description: '사용자 ID, 로컬 등록이 된 계정만 이 필드가 존재합니다.',
    example: 'johndoe123',
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: '최소 6자 이상 입력해주세요.' })
  username?: string;

  @ApiProperty({
    description: '이메일 주소',
    example: 'example@example.com',
  })
  @IsEmail()
  email?: string;
}
