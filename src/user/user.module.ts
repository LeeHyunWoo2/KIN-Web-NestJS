import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { TokenService } from '@/auth/token.service';
import { RedisProvider } from '@/config/redis.provider.config';
import { SocialAccount } from '@/user/entity/social-account.entity';

import { User } from './entity/user.entity';
import { UserService } from './user.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([User, SocialAccount]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('auth.accessTokenSecret'),
        signOptions: {
          expiresIn: config.getOrThrow<number>('auth.jwtExpiration'),
        },
      }),
    }),
  ],
  providers: [UserService, RedisProvider, TokenService],
  exports: [UserService],
})
export class UserModule {}
