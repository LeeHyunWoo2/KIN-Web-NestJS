import { registerAs } from '@nestjs/config';

export const mailConfig = registerAs('mail', () => ({
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASSWORD,
}));
