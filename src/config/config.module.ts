import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import appConfig from './app.config';
import authConfig from './auth.config';
import mailConfig from './mail.config';
import mongodbConfig from './mongodb.config';
import oauthConfig from './oauth.config';
import redisConfig from './redis.config';
import securityConfig from './security.config';
import validationSchema from './validation';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      load: [
        appConfig,
        authConfig,
        securityConfig,
        oauthConfig,
        mailConfig,
        mongodbConfig,
        redisConfig,
      ],
    }),
  ],
})
export class ConfigModule {}
