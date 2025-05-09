import { FastifyReply } from 'fastify';
import { JwtPayload } from 'jsonwebtoken';

export interface UserSnapshot {
  id: number;
  username?: string;
  name: string;
  email: string;
  password?: string;
  passwordHistory?: PasswordHistoryEntry[];
  termsAgreed?: boolean;
  marketingConsent?: boolean;
  socialAccounts: SocialAccount[];
  role: UserRole;
  profileIcon: string;
  deleteQueue?: {
    url: string;
    queuedAt: Date;
  }[];
  createdAt: Date;
  updatedAt?: Date;
  lastActivity?: Date;
}

export interface PasswordHistoryEntry {
  password: string;
  changedAt: Date;
}

export interface SocialAccount {
  provider: 'google' | 'kakao' | 'naver' | 'local';
  providerId: string;
  socialRefreshToken?: string;
}

export interface ResetPasswordInput {
  email: string;
  newPassword: string;
}

export interface AddLocalAccountInput {
  id: number;
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserInput {
  id: number;
  data: UpdateUserProfileData;
}

export interface CreateSocialUserInput {
  provider: 'google' | 'kakao' | 'naver';
  providerId: string;
  email: string;
  name: string;
  profileIcon?: string;
  socialRefreshToken?: string;
}

export interface DeleteUserInput {
  id: number;
  accessToken?: string;
  refreshToken?: string;
}

export type UserRole = 'user' | 'admin';

export interface AccessTokenPayload extends JwtPayload {
  id: number;
  email: string;
  role: UserRole;
}

export interface RefreshTokenPayload extends JwtPayload {
  id: number;
  rememberMe: boolean;
}

export interface SocialTokenUser {
  socialAccounts: SocialAccount[];
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

export interface EmailTokenPayload extends JwtPayload {
  email: string;
}

export type DecodedUser = AccessTokenPayload;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenTtl: number;
}

export type PublicUserProfile = Pick<UserSnapshot, 'name' | 'email' | 'profileIcon' | 'role'> & {
  id: number;
};

export interface SendVerificationEmailInput {
  email: string;
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

export type SafeUserInfo = Pick<
  UserSnapshot,
  'name' | 'email' | 'username' | 'profileIcon' | 'role' | 'createdAt'
>;

export interface FindUserQueryData {
  username?: string;
  email?: string;
  socialAccounts?: SocialAccount[];
  signal: 'user_found' | 'user_not_found';
  accountType?: 'Local' | 'SNS';
}

export interface UpdateUserProfileData {
  name?: string;
  profileIcon?: string;
}

export interface FindUserQuery {
  input: string;
  inputType: 'username' | 'email';
}

export type PassportAuthResultError =
  | Error
  | { code?: number; message?: string }
  | string
  | undefined;
