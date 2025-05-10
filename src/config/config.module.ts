import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import postgresConfig from '@/config/postgres.config';
import { validationSchema } from '@/config/validation';

import { appConfig } from './app.config';
import { authConfig } from './auth.config';
import { mailConfig } from './mail.config';
import { oauthConfig } from './oauth.config';
import { redisConfig } from './redis.config';
import { securityConfig } from './security.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validationSchema: validationSchema,
      load: [
        appConfig,
        authConfig,
        securityConfig,
        oauthConfig,
        mailConfig,
        redisConfig,
        postgresConfig,
      ],
    }),
  ],
})
export class ConfigModule {}
