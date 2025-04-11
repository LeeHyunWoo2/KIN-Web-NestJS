import { FastifyReply } from 'fastify';

import { getConfig } from '@/config/global-config.service';
import { TokenPair } from '@/types/user.types';

import { setCookie } from './set-cookie.util';

export const setAuthCookies = (reply: FastifyReply, tokens: TokenPair): void => {
  const config = getConfig();
  const accessTokenTtl = config.get<number>('auth.accessTokenTtl') ?? 3600;

  setCookie(reply, 'accessToken', tokens.accessToken, {
    maxAge: accessTokenTtl * 1000,
  });

  setCookie(reply, 'refreshToken', tokens.refreshToken, {
    maxAge: tokens.refreshTokenTtl * 1000,
  });
};
