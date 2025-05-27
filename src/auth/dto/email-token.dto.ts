import { IsEmail } from 'class-validator';

import { EmailTokenPayload } from '@/auth/types/auth-service.types';
import { UserSnapshot } from '@/types/user-entity.types';

type EmailField = Pick<UserSnapshot, 'email'>;

export class RequestEmailTokenDto implements EmailField {
  @IsEmail()
  email: string;
}

export class SendVerificationEmailResponseDto {
  message: string;
}

export class VerifyEmailTokenResponseDto {
  message: string;
  email: EmailTokenPayload;
}
