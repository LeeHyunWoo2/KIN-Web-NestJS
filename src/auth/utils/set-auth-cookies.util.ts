import { FastifyReply } from 'fastify';

import { TokenPair } from '@/auth/types/auth-service.types';
import { getConfig } from '@/config/global-config.service';

import { setCookie } from './set-cookie.util';

interface SetAuthCookiesInput {
  reply: FastifyReply;
  tokens: TokenPair;
}

export const setAuthCookies = ({ reply, tokens }: SetAuthCookiesInput): void => {
  const config = getConfig();
  const accessTokenTtl = config.get<number>('auth.accessTokenTtl') ?? 3600;

  setCookie(reply, 'accessToken', tokens.accessToken, {
    maxAge: accessTokenTtl * 1000,
  });

  setCookie(reply, 'refreshToken', tokens.refreshToken, {
    maxAge: tokens.refreshTokenTtl * 1000,
  });
};
