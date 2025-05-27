import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { RedisProvider } from '@/config/redis.provider.config';
import { SocialAccount } from '@/user/entity/social-account.entity';
import { User } from '@/user/entity/user.entity';
import { UserService } from '@/user/user.service';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { GoogleLinkStrategy } from './strategies/google-link.strategy';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { KakaoLinkStrategy } from './strategies/kakao-link.strategy';
import { NaverStrategy } from './strategies/naver.strategy';
import { NaverLinkStrategy } from './strategies/naver-link.strategy';
import { TokenService } from './token.service';

@Module({
  imports: [
    ConfigModule,
    MikroOrmModule.forFeature([User, SocialAccount]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('auth.accessTokenSecret'),
        signOptions: {
          expiresIn: configService.getOrThrow<number>('auth.jwtExpiration'),
        },
      }),
    }),
  ],
  controllers: [AuthController, EmailController, SocialController],
  providers: [
    AuthService,
    EmailService,
    SocialService,
    TokenService,
    UserService,
    RedisProvider,
    GoogleStrategy,
    KakaoStrategy,
    NaverStrategy,
    GoogleLinkStrategy,
    KakaoLinkStrategy,
    NaverLinkStrategy,
  ],
  exports: [TokenService],
})
export class AuthModule {}
