import { registerAs } from '@nestjs/config';

export default registerAs('oauth', () => ({
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    linkCallbackUrl: process.env.GOOGLE_LINK_CALLBACK_URL,
  },
  kakao: {
    clientId: process.env.KAKAO_CLIENT_ID,
    clientSecret: process.env.KAKAO_CLIENT_SECRET,
    callbackUrl: process.env.KAKAO_CALLBACK_URL,
    linkCallbackUrl: process.env.KAKAO_LINK_CALLBACK_URL,
  },
  naver: {
    clientId: process.env.NAVER_CLIENT_ID,
    clientSecret: process.env.NAVER_CLIENT_SECRET,
    callbackUrl: process.env.NAVER_CALLBACK_URL,
    linkCallbackUrl: process.env.NAVER_LINK_CALLBACK_URL,
  },
}));
