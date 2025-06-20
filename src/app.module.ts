import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AopModule } from '@toss/nestjs-aop';
import { LoggerModule } from 'nestjs-pino';
import pino from 'pino';

import { CommonAopModule } from '@/common/aop/aop.module';
import { createMultiStream } from '@/common/logger/create-multi-stream';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { UserController } from './user/user.controller';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    AopModule,
    CommonAopModule,
    ConfigModule,
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('app.nodeEnv');

        return {
          driver: PostgreSqlDriver,
          host: configService.getOrThrow<string>('postgres.host'),
          port: configService.getOrThrow<number>('postgres.port'),
          dbName: configService.getOrThrow<string>('postgres.dbName'),
          user: configService.getOrThrow<string>('postgres.user'),
          password: configService.getOrThrow<string>('postgres.password'),
          synchronize: nodeEnv === 'development' || nodeEnv === 'test',
          autoLoadEntities: true,
        };
      },
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('app.nodeEnv') === 'production';
        return {
          pinoHttp: {
            stream: isProduction ? pino.destination(1) : createMultiStream(),
            autoLogging: false,
          },
        };
      },
    }),
    AuthModule,
    UserModule,
  ],
  controllers: [AppController, UserController],
  providers: [AppService],
})
export class AppModule {}
