import { IsBoolean, IsEmail, IsString } from 'class-validator';

import { UserSnapshot } from '@/types/user.types';

type RegisterFields = Pick<
  UserSnapshot,
  'username' | 'email' | 'password' | 'name' | 'marketingConsent'
>;

export class RegisterDto implements RegisterFields {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  name: string;

  @IsBoolean()
  marketingConsent: boolean;
}
