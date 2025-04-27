import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AopModule } from '@toss/nestjs-aop';

import { CommonAopModule } from '@/common/aop/aop.module';
import { User } from '@/user/entity/user.entity';

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
      useFactory: (config: ConfigService) => ({
        driver: PostgreSqlDriver,
        host: config.getOrThrow('postgres.host'),
        port: config.getOrThrow('postgres.port'),
        dbName: config.getOrThrow('postgres.dbName'),
        user: config.getOrThrow('postgres.user'),
        password: config.getOrThrow('postgres.password'),
        autoLoadEntities: true,
        entities: [User],
      }),
    }),
    AuthModule,
    UserModule,
  ],
  controllers: [AppController, UserController],
  providers: [AppService],
})
export class AppModule {}
