import { IsBoolean, IsEmail, IsString } from 'class-validator';

import { UserTypes } from '@/types/user.types';

type RegisterFields = Pick<
  UserTypes,
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
