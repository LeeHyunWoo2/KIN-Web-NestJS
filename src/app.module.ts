import { Module } from '@nestjs/common';
import { AopModule } from '@toss/nestjs-aop';

import { CommonAopModule } from '@/common/aop/aop.module';
import { MongoDbProvider } from '@/config/mongodb.provider.config';
import { RedisProvider } from '@/config/redis.provider.config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { UserController } from './user/user.controller';
import { UserModule } from './user/user.module';

@Module({
  imports: [AopModule, CommonAopModule, ConfigModule, AuthModule, MongoDbProvider, UserModule],
  controllers: [AppController, UserController],
  providers: [AppService, RedisProvider],
  exports: [RedisProvider],
})
export class AppModule {}
