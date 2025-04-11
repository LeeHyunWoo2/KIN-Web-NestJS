import { IsEmail } from 'class-validator';

import { UserTypes } from '@/types/user.types';

type EmailField = Pick<UserTypes, 'email'>;

export class RequestEmailTokenDto implements EmailField {
  @IsEmail()
  email: string;
}
