import { JwtPayload } from 'jsonwebtoken';

export interface UserSnapshot {
  _id: string;
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

export type UserRole = 'user' | 'admin';

export interface AccessTokenPayload extends JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface RefreshTokenPayload extends JwtPayload {
  id: string;
  rememberMe: boolean;
  ttl: number;
}

export interface SocialTokenUser {
  socialAccounts: SocialAccount[];
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
  userId: string;
};

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
  inputType: string;
}

export type PassportAuthResultError =
  | Error
  | { code?: number; message?: string }
  | string
  | undefined;
