import {PassportStatic} from 'passport';
import {Request} from 'express';
import {
  Strategy as GoogleStrategy,
  Profile as GoogleProfile,
  VerifyCallback
} from 'passport-google-oauth20';
import {Strategy as KakaoStrategy, Profile as KakaoProfile} from 'passport-kakao';
import {Strategy as NaverStrategy, Profile as NaverProfile} from 'passport-naver';
import User from '@/models/user';
import {AccessTokenPayload} from '@/types/User';

// 소셜 로그인/가입 passport.js 인증 전략
export const configureSocialStrategies = (passport: PassportStatic): void => {
// Google 로그인/가입 전략
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
    passReqToCallback: true,
  }, async (
      _req: Request,
      _accessToken: string,
      refreshToken: string,
      _params: any,
      profile: GoogleProfile,
      done: VerifyCallback
  ) => {
    try {
      const providerId = profile.id;
      const existingUser = await User.findOne({
        'socialAccounts.provider': 'google',
        'socialAccounts.providerId': providerId,
      });

      if (existingUser) {
        // 로그인
        return done(null, existingUser as AccessTokenPayload);
      }
      // 회원가입
      const newUser = await User.create({
        name: profile.displayName,
        email: profile.emails?.[0]?.value,
        profileIcon: profile.photos?.[0]?.value,
        socialAccounts: [{
          provider: 'google',
          providerId,
          socialRefreshToken: refreshToken,
        }],
        termsAgreed: true,
      });
      return done(null, newUser as AccessTokenPayload);
    } catch (error) {
      console.error(error)
      return done(error, false);
    }
  }));

// Kakao 로그인/가입 전략
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_CLIENT_ID as string,
    clientSecret: process.env.KAKAO_CLIENT_SECRET as string,
    callbackURL: process.env.KAKAO_CALLBACK_URL as string,
    passReqToCallback: true,
  }, async (
      _req: Request,
      _accessToken: string,
      refreshToken: string,
      profile: KakaoProfile,
      done: (error: any, user?: AccessTokenPayload | false) => void
  ) => {
    try {
      const providerId = profile.id;
      const existingUser = await User.findOne({
        'socialAccounts.provider': 'kakao',
        'socialAccounts.providerId': providerId,
      });

      if (existingUser) {
        return done(null, existingUser as AccessTokenPayload);
      }

      const newUser = await User.create({
        name: profile.displayName,
        email: profile._json?.kakao_account?.email,
        profileIcon: profile._json?.properties?.profile_image,
        socialAccounts: [{
          provider: 'kakao',
          providerId,
          socialRefreshToken: refreshToken,
        }],
        termsAgreed: true,
      });
      return done(null, newUser as AccessTokenPayload);
    } catch (error) {
      console.error(error)
      return done(error, false);
    }
  }));

// Naver 로그인/가입 전략
  passport.use(new NaverStrategy({
    clientID: process.env.NAVER_CLIENT_ID as string,
    clientSecret: process.env.NAVER_CLIENT_SECRET as string,
    callbackURL: process.env.NAVER_CALLBACK_URL as string,
    passReqToCallback: true,
  }, async (
      _req: Request,
      _accessToken: string,
      refreshToken: string,
      profile: NaverProfile,
      done: (error: any, user?: AccessTokenPayload | false) => void
  ) => {
    try {
      const providerId = profile.id;
      const existingUser = await User.findOne({
        'socialAccounts.provider': 'naver',
        'socialAccounts.providerId': providerId,
      });

      if (existingUser) {
        return done(null, existingUser as AccessTokenPayload);
      }

      const newUser = await User.create({
        name: profile.displayName,
        email: profile._json.email,
        profileIcon: profile._json.profile_image,
        socialAccounts: [{
          provider: 'naver',
          providerId,
          socialRefreshToken: refreshToken,
        }],
        termsAgreed: true,
      });
      return done(null, newUser as AccessTokenPayload);
    } catch (error) {
      console.error(error)
      return done(error, false);
    }
  }));
};