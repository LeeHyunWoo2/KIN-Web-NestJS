import { FastifyReply } from 'fastify';
import { JwtPayload } from 'jsonwebtoken';

import { SocialAccount, UserRole } from '@/types/user-entity.types';

export interface AccessTokenPayload extends JwtPayload {
  id: number;
  email: string;
  role: UserRole;
}

export interface RefreshTokenPayload extends JwtPayload {
  id: number;
  rememberMe: boolean;
}

export interface EmailTokenPayload extends JwtPayload {
  email: string;
}

export type DecodedUser = AccessTokenPayload;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenTtl: number;
}

export interface SocialTokenUser {
  socialAccounts: SocialAccount[];
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  name: string;
  marketingConsent?: boolean;
}

export interface LoginUserInput {
  username: string;
  password: string;
  rememberMe: boolean;
}

export interface SendVerificationEmailInput {
  email: string;
}

export interface SocialCallbackInput {
  user: AccessTokenPayload | undefined;
  reply: FastifyReply;
  error?: PassportAuthResultError;
}

export interface RedirectAfterLinkInput {
  reply: FastifyReply;
  error: PassportAuthResultError;
}

export interface UnlinkSocialAccountInput {
  id: number;
  provider: 'google' | 'kakao' | 'naver';
}

export interface GenerateOAuthToken {
  user: SocialTokenUser;
  provider: 'google' | 'kakao' | 'naver';
}

export type PassportAuthResultError =
  | Error
  | { code?: number; message?: string }
  | string
  | undefined;
