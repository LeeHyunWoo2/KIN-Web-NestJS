import { PassportStatic } from 'passport';
import { Request } from 'express';
import {Strategy as GoogleStrategy, Profile as GoogleProfile} from 'passport-google-oauth20';
import {Strategy as KakaoStrategy, Profile as KakaoProfile} from 'passport-kakao';
import {Strategy as NaverStrategy, Profile as NaverProfile} from 'passport-naver';
import User from '../../models/user';
import { HydratedDocument } from "mongoose";
import { UserTypes } from "../../types/User";

// 소셜 추가연동 passport.js 인증 전략
export const configureLinkingStrategies = (passport : PassportStatic) => {
// Google 연동 전략
  passport.use('google-link', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    callbackURL: process.env.GOOGLE_LINK_CALLBACK_URL as string,
    passReqToCallback: true,
  }, async (
      req : Request,
      _accessToken : string,
      refreshToken : string,
      profile : GoogleProfile,
      done : (error : any, user? : HydratedDocument<UserTypes> | false) => void
  ) => {
    try {
      const providerId = profile.id;
      const user = await User.findById(req.user?.id);

      if (user) {
        user.socialAccounts.push({
          provider: 'google',
          providerId,
          socialRefreshToken: refreshToken,
        });
        await user.save();
        return done(null, user);
      }
      return done(new Error);
    } catch (error) {
      console.error(error);
      return done(error, false);
    }
  }));

// Kakao 연동 전략
  passport.use('kakao-link', new KakaoStrategy({
    clientID: process.env.KAKAO_CLIENT_ID as string,
    clientSecret: process.env.KAKAO_CLIENT_SECRET as string,
    callbackURL: process.env.KAKAO_LINK_CALLBACK_URL as string,
    passReqToCallback: true,
  }, async (
      req : Request,
      _accessToken : string,
      refreshToken : string,
      profile : KakaoProfile,
      done : (error : any, user? : HydratedDocument<UserTypes> | false) => void
  ) => {
    try {
      const providerId = profile.id;
      const user = await User.findById(req.user?.id);

      if (user) {
        user.socialAccounts.push({
          provider: 'kakao',
          providerId,
          socialRefreshToken: refreshToken,
        });
        await user.save();
        return done(null, user);
      }
      return done(new Error);
    } catch (error) {
      return done(error, false);
    }
  }));

// Naver 연동 전략
  passport.use('naver-link', new NaverStrategy({
    clientID: process.env.NAVER_CLIENT_ID as string,
    clientSecret: process.env.NAVER_CLIENT_SECRET as string,
    callbackURL: process.env.NAVER_LINK_CALLBACK_URL as string,
    passReqToCallback: true,
  }, async (
      req : Request,
      _accessToken : string,
      refreshToken : string,
      profile : NaverProfile,
      done : (error : any, user? : HydratedDocument<UserTypes> | false) => void
  ) => {
    try {
      const providerId = profile.id;
      const user = await User.findById(req.user?.id);

      if (user) {
        user.socialAccounts.push({
          provider: 'naver',
          providerId,
          socialRefreshToken: refreshToken,
        });
        await user.save();
        return done(null, user);
      }
      return done(new Error);
    } catch (error) {
      return done(error, false);
    }
  }));
};