import axios from 'axios';
import {redisClient} from '@/config/redis';
import jwt, {JsonWebTokenError, JwtPayload, TokenExpiredError} from 'jsonwebtoken';
import {
  AccessTokenPayload,
  EmailTokenPayload,
  RefreshTokenPayload, SocialAccountTypes,
  TokenPair,
  UserTypes
} from "@/types/User";
import {createHttpError} from "@/utils/createHttpError";

const {
  JWT_SECRET,
  JWT_EXPIRATION,
  REFRESH_TOKEN_SECRET,
} = process.env;

const REMEMBER_RENEW_REFRESH_TTL_LIMIT = parseInt(process.env.REMEMBER_RENEW_REFRESH_TTL_LIMIT, 10);
const REMEMBER_REFRESH_EXPIRATION = parseInt(process.env.REMEMBER_REFRESH_EXPIRATION, 10);
const RENEW_REFRESH_TTL_LIMIT = parseInt(process.env.RENEW_REFRESH_TTL_LIMIT, 10);
const REFRESH_EXPIRATION = parseInt(process.env.REFRESH_EXPIRATION, 10);

// JWT 토큰 발급
export const generateTokens = async (
    user: UserTypes,
    rememberMe: boolean = false,
    existingTTL : number | null
) : Promise<TokenPair>=> {
  const accessTokenTTL = parseInt(JWT_EXPIRATION, 10);
  let refreshTokenTTL: number;

  if (existingTTL) {
    // TTL값을 받았을경우엔 기존의 TTL유지
    refreshTokenTTL = existingTTL;
  } else {
    refreshTokenTTL = rememberMe ? REMEMBER_REFRESH_EXPIRATION : REFRESH_EXPIRATION;
  }

  const accessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      {expiresIn: accessTokenTTL}
  );

  const refreshToken = jwt.sign(
      {
        id: user._id
      },
      REFRESH_TOKEN_SECRET,
      {expiresIn: refreshTokenTTL}
  );

  await saveRefreshTokenToRedis(
      user._id,
      refreshToken,
      refreshTokenTTL,
      rememberMe
  );

  return {
    accessToken,
    refreshToken,
    refreshTokenTTL
  };
};

// 액세스 토큰 검증
export const verifyAccessToken = async (
    accessToken: string
): Promise<AccessTokenPayload> => {
  if (!accessToken) {
    const err = new Error('Access Denied.') as unknown as {code: string};
    err.code = 'TOKEN_MISSING';
    throw err;
  }

  const isBlacklisted = await redisClient.get(`blacklist:${accessToken}`);
  if (isBlacklisted) {
    const err = new Error('Access Denied.') as unknown as {code: string};
    err.code = 'TOKEN_BLACKLISTED';
    throw err;
  }

  try {
    const decoded = jwt.verify(accessToken, JWT_SECRET, {
      algorithms: ['HS256'], // 알고리즘 고정
    });

    if (typeof decoded === 'string') {
      throw new Error('JwtPayload 타입에러');
    }

    return decoded as AccessTokenPayload;
  } catch (error: any) {
    const err = new Error('Access Denied.') as unknown as { code: string };

    if (error instanceof TokenExpiredError) {
      err.code = 'TOKEN_EXPIRED';
    } else if (error instanceof JsonWebTokenError) {
      err.code = 'TOKEN_INVALID';
    } else {
      err.code = 'UNKNOWN_ERROR';
    }

    throw err;
  }
};


// 리프레시 토큰 검증
export const verifyRefreshToken = async (
    refreshToken: string
): Promise<RefreshTokenPayload> => {
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as JwtPayload;
    const userId = decoded.id;

    const storedTokenString = await redisClient.get(`refreshToken:${userId}`);
    if (!storedTokenString) {
      throw createHttpError(419, "Access denied.");
    }
    // 한줄로 작성하면 결과가 string | null 인데, json.parse는 null을 처리하지 않기 때문에 타입을 좁힘
    const storedToken: {
      token: string;
      rememberMe: boolean;
    } = JSON.parse(storedTokenString);

    if (!storedToken.token || storedToken.token !== refreshToken) {
      throw createHttpError(419, "Access denied.");
    }

    let existingTokenTTL = await redisClient.ttl(`refreshToken:${userId}`);
    if (existingTokenTTL < 0) {
      throw createHttpError(419, "Access denied.");

      // 자동로그인 유저의 리프레시 토큰의 만료가 3일 미만일경우
    } else if (storedToken.rememberMe && existingTokenTTL
        < REMEMBER_RENEW_REFRESH_TTL_LIMIT) {
      existingTokenTTL = REMEMBER_REFRESH_EXPIRATION;

      // 일반 로그인 유저의 만료가 3시간 미만일경우
    } else if (!storedToken.rememberMe && existingTokenTTL
        < RENEW_REFRESH_TTL_LIMIT) {
      existingTokenTTL = REFRESH_EXPIRATION;
    }

    return {
      id: userId,
      rememberMe: storedToken.rememberMe,
      ttl: existingTokenTTL,
    };
  } catch {
    throw createHttpError(419, "Access denied.");
  }
};

// 소셜 연동 해제용 OAuth 토큰 발급
export const generateOAuthToken = async (
    user: { socialAccounts: SocialAccountTypes[] },
    provider: 'google' | 'kakao' | 'naver'
): Promise<string> => {
  const socialAccount = user.socialAccounts.find(
      account => account.provider === provider);
  if (!socialAccount) {
    throw new Error;
  }

  try {
    if (provider === 'google') {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: socialAccount.socialRefreshToken,
        grant_type: 'refresh_token',
      });
      return response.data.access_token;

    } else if (provider === 'kakao') {
      const response = await axios.post('https://kauth.kakao.com/oauth/token',
          null, {
            params: {
              grant_type: 'refresh_token',
              client_id: process.env.KAKAO_CLIENT_ID,
              client_secret: process.env.KAKAO_CLIENT_SECRET,
              refresh_token: socialAccount.socialRefreshToken,
            },
          });
      return response.data.access_token;

    } else if (provider === 'naver') {
      const response = await axios.post('https://nid.naver.com/oauth2.0/token',
          null, {
            params: {
              grant_type: 'refresh_token',
              client_id: process.env.NAVER_CLIENT_ID,
              client_secret: process.env.NAVER_CLIENT_SECRET,
              refresh_token: socialAccount.socialRefreshToken,
            },
          });
      return response.data.access_token;

    } else {
      throw new Error();
    }

  } catch {
    throw new Error;
  }
};

// 메일 인증용 토큰
export const generateEmailVerificationToken = (
    email: string
): string => jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: '10m',
  });

// 메일 인증용 토큰 검증
export const verifyEmailVerificationToken = (
    token: string
): EmailTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as EmailTokenPayload;
    return decoded;
  } catch (error) {
    console.error('이메일 인증 토큰 검증 실패:', (error as Error).message);
    return null;
  }
};

// Redis에 RefreshToken 저장
export const saveRefreshTokenToRedis = async (
    userId: string,
    refreshToken: string,
    ttl: number,
    rememberMe: boolean
): Promise<void> => {
  try {
    await redisClient.set(
        `refreshToken:${userId}`,
        JSON.stringify({ token: refreshToken, rememberMe }),
        'EX',
        ttl
    );
  } catch (error: any) {
    console.error('Redis에 Refresh Token 저장 중 오류:', error.message);
    throw new Error('Redis 오류로 Refresh Token 저장 실패');
  }
};

// Redis에서 특정 RefreshToken 삭제
export const deleteRefreshTokenFromRedis = async (
    userId : string,
):Promise<void> => {
  // 타이밍 문제로 지워지지 않는 경우가 생겨 나눠 작성
  await redisClient.del(`refreshToken:${userId}`);
  await redisClient.del(`publicProfile:${userId}`);
};

// 로그아웃한 AccessToken을 블랙리스트에 추가
export const invalidateAccessToken = async (
    accessToken: string
): Promise<void> => {
  const decoded = jwt.decode(accessToken) as { exp: number } | null;

  if (!decoded) {
    console.error('exp 추출 실패')
    return;
  }

  const ttl = Math.floor((decoded.exp * 1000 - Date.now()) / 1000);
  if (ttl > 0) {
    await redisClient.set(`blacklist:${accessToken}`, 'true', 'EX', ttl);
  }
};