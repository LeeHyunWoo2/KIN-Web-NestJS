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

export interface AccessTokenPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  id: string;
  rememberMe: boolean;
  ttl: number;
}

export interface GenerateOAuthToken {
  user: UserSnapshot;
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

export type SafeUserInfo = Omit<
  UserSnapshot,
  '_id' | 'password' | 'passwordHistory' | 'deleteQueue'
>;

export type FindUserQueryData = Pick<UserSnapshot, 'username' | 'email' | 'socialAccounts'>;

export interface UpdateUserProfileData {
  name?: string;
  profileIcon?: string;
}

export interface FindUserQuery {
  input: string;
  inputType: string;
}
