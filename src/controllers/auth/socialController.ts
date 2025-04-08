import {Request, Response} from 'express';
import {generateTokens} from '@/services/auth/tokenService';
import setCookie from '@/utils/setCookie';
import {unlinkAccount} from '@/services/user/socialService';
import {sendFormattedError} from "@/utils/sendFormattedError";
import {CustomError} from "@/types/CustomError";
import {logError} from "@/utils/logError";

const accessTokenMaxAge = 60 * 60 * 1000; // 1시간

export const handleSocialCallback = async (req:Request, res:Response): Promise<void> => {
  const { error, user } = req.authResult || {};

  if (error || !user) {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const err = error as { code: number };
      if (err.code === 11000) {
        res.redirect(
            `${process.env.FRONTEND_ORIGIN}/login?error=${encodeURIComponent(
                '해당 이메일로 가입된 일반계정이 있습니다.'
            )}`
        );
        return;
      }
    }
    res.redirect(`${process.env.FRONTEND_ORIGIN}/login`);
    return;
  }

  try {
    const tokens = await generateTokens(user, false, null);

    setCookie(res, 'accessToken', tokens.accessToken, {
      maxAge: accessTokenMaxAge,
      domain: process.env.NODE_ENV === 'production' ? 'noteapp.org' : undefined
    });

    setCookie(res, 'refreshToken', tokens.refreshToken, {
      maxAge: tokens.refreshTokenTTL * 1000,
      domain: process.env.NODE_ENV === 'production' ? 'noteapp.org' : undefined
    });

    res.redirect(`${process.env.FRONTEND_ORIGIN}/loginSuccess`);
  } catch (error) {
    logError(error, req);
    res.redirect(`${process.env.FRONTEND_ORIGIN}/login`);
  }
};

export const handleSocialLinkCallback = (req:Request, res:Response): void => {
  const { error } = req.authResult || {};
  if (error) {
    res.redirect(
        `${process.env.FRONTEND_ORIGIN}/userinfo?error=${encodeURIComponent('이미 연동된 계정입니다.')}`
    );
    return;
  }
  res.redirect(`${process.env.FRONTEND_ORIGIN}/userinfo`);
};

export const unlinkSocialAccount = async (req:Request, res:Response): Promise<void> => {
  try {
    const { provider } = req.body;
    await unlinkAccount(req.user?.id as string, provider);
    res.status(200).json();
  } catch (error) {
    logError(error, req);
    sendFormattedError(res, error as CustomError, "소셜 계정 연동 해제 중 오류가 발생했습니다.")
  }
};