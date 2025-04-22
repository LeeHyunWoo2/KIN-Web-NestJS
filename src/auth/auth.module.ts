import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SocialService } from '@/auth/services/social/social.service';
import { TokenService } from '@/auth/services/token/token.service';
import { GoogleStrategy } from '@/auth/strategies/google.strategy';
import { GoogleLinkStrategy } from '@/auth/strategies/google-link.strategy';
import { KakaoStrategy } from '@/auth/strategies/kakao.strategy';
import { KakaoLinkStrategy } from '@/auth/strategies/kakao-link.strategy';
import { NaverStrategy } from '@/auth/strategies/naver.strategy';
import { NaverLinkStrategy } from '@/auth/strategies/naver-link.strategy';
import { RedisProvider } from '@/config/redis.provider.config';
import { User, UserSchema } from '@/user/schemas/user.schema';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailController } from './controllers/email/email.controller';
import { SocialController } from './controllers/social/social.controller';
import { EmailService } from './services/email/email.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [AuthController, EmailController, SocialController],
  providers: [
    AuthService,
    TokenService,
    RedisProvider,
    GoogleStrategy,
    NaverStrategy,
    KakaoStrategy,
    SocialService,
    GoogleLinkStrategy,
    NaverLinkStrategy,
    KakaoLinkStrategy,
    EmailService,
  ],
  exports: [AuthService, TokenService, SocialService],
})
export class AuthModule {}
