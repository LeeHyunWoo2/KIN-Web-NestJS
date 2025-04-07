import {Request, Response} from 'express';
import {CustomError} from "@/types/CustomError";
import {registerUser, loginUser, getUserById} from '@/services/auth/authService';
import {
  generateTokens,
  verifyRefreshToken,
  deleteRefreshTokenFromRedis,
  invalidateAccessToken,
} from '@/services/auth/tokenService';
import {sendFormattedError} from "@/utils/sendFormattedError";
import setCookie from "../../utils/setCookie";
import jwt from 'jsonwebtoken';
import {
  LoginRequestDto,
  RegisterRequestDto,
} from '@/types/dto/auth/auth.request.dto'
import {
  LoginResponseDto,
} from '@/types/dto/auth/auth.response.dto'
import {RefreshTokenPayload, UserTypes} from "@/types/User";


const accessTokenMaxAge = Number(process.env.JWT_EXPIRATION) * 1000;

export const registerController = async (
    req: Request<{}, {}, RegisterRequestDto>,
    res: Response
): Promise<void> => {
  try {
    const {username, email, password, name, marketingConsent} = req.body;
    await registerUser({
      username,
      email,
      password,
      name,
      marketingConsent
    });

    res.status(201).json();
  } catch (error) {
    sendFormattedError(res, error as CustomError, "회원가입 중 오류가 발생했습니다.")
  }
};

// 로그인 (로컬 계정용)
export const loginController = async (
    req: Request<{}, {}, LoginRequestDto>,
    res: Response<LoginResponseDto>
): Promise<void> => {
  try {
    const {username, password, rememberMe} = req.body ;
    const tokens = await loginUser({username, password, rememberMe});

    setCookie(res, 'accessToken', tokens.accessToken, {
      maxAge: accessTokenMaxAge
    });
    setCookie(res, 'refreshToken', tokens.refreshToken, {
      maxAge: tokens.refreshTokenTTL * 1000
    });

    res.status(200).json({success: true});
  } catch (error) {
    sendFormattedError(res, error as CustomError, "로그인 중 오류가 발생했습니다.")
  }
};

export const logoutController = async (
    req: Request,
    res: Response
): Promise<void> => {
  try {
    const {accessToken, refreshToken} = req.cookies;

    if (refreshToken) {
      const decoded = jwt.decode(refreshToken) as RefreshTokenPayload;
      await deleteRefreshTokenFromRedis(decoded.id);
    }

    if (accessToken) {
      await invalidateAccessToken(accessToken);
    }

    res.clearCookie('accessToken', {
      httpOnly: true,
      domain: process.env.NODE_ENV === 'production' ? 'noteapp.org' : undefined
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      domain: process.env.NODE_ENV === 'production' ? 'noteapp.org' : undefined
    });

    res.status(200).json();
  } catch (error: unknown) {
    sendFormattedError(res, error as CustomError, "로그아웃 중 오류가 발생했습니다.")
  }
};

export const renewTokenController = async (
    req: Request,
    res: Response
): Promise<void> => {
  try {
    const {refreshToken} = req.cookies;

    const decodedData = await verifyRefreshToken(refreshToken);
    const user = await getUserById(decodedData.id) as unknown as UserTypes;
    const tokens = await generateTokens(user, decodedData.rememberMe, decodedData.ttl);

    setCookie(res, 'accessToken', tokens.accessToken, {maxAge: accessTokenMaxAge});
    setCookie(res, 'refreshToken', tokens.refreshToken, {maxAge: tokens.refreshTokenTTL * 1000});

    res.status(200).json();
  } catch (error) {
    sendFormattedError(res, error as CustomError, "토큰 갱신 중 오류가 발생했습니다.")
  }
};
