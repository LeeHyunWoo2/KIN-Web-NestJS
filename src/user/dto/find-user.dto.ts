import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsString } from 'class-validator';

export class FindUserDto {
  @ApiProperty({ description: '찾고자 하는 입력 데이터', example: 'johndoe123' })
  @IsString()
  input: string;

  @ApiProperty({
    description:
      '검색할 데이터를 결정하는 플래그. username 일 경우 아이디 중복확인과 비밀번호 찾기,' +
      'email 일 경우 이메일 중복확인과 아이디 찾기를 진행하는데 사용됩니다.',
    example: 'username',
  })
  @IsIn(['username', 'email'])
  inputType: 'username' | 'email';

  @ApiProperty({
    description:
      '기능에 따라 자동으로 설정되는 플래그입니다.' +
      '중복확인 요청이라면 false, 아이디 찾기 요청이라면 true' +
      '(비밀번호 찾기는 dataFetch가 아니라 비밀번호 재설정 로직이 진행됩니다.)',
    example: false,
  })
  @IsBoolean()
  fetchUsername: boolean;
}
