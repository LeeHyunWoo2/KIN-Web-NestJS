import { IsBoolean, IsIn, IsString } from 'class-validator';

export class FindUserDto {
  @IsString()
  input: string;

  @IsIn(['username', 'email'])
  inputType: 'username' | 'email';

  @IsBoolean()
  fetchUsername: boolean;
}
