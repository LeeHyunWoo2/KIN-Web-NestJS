import { IsEmail } from 'class-validator';

import { UserSnapshot } from '@/types/user.types';

type EmailField = Pick<UserSnapshot, 'email'>;

export class RequestEmailTokenDto implements EmailField {
  @IsEmail()
  email: string;
}
