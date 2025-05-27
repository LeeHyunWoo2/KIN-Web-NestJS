import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT || '5000', 10),
  frontendOrigin: process.env.FRONTEND_ORIGIN,
  nodeEnv: process.env.NODE_ENV || 'development',
}));
