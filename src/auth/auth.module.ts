import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TokenService } from '@/auth/services/token.service';
import { RedisProvider } from '@/config/redis.provider.config';
import { User, UserSchema } from '@/user/schemas/user.schema';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, RedisProvider],
  exports: [AuthService],
})
export class AuthModule {}
