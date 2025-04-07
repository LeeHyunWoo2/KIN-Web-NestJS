import {JwtPayload} from "jsonwebtoken";

// DB 모델 기준 전체 사용자 구조
export interface UserTypes {
  _id: string;
  username?: string;
  name: string;
  email: string;
  password?: string;
  passwordHistory?: PasswordHistoryTypes[];
  termsAgreed?: boolean;
  marketingConsent?: boolean;
  socialAccounts: SocialAccountTypes[];
  role: UserRole;
  profileIcon?: string;
  deleteQueue?: {
    url: string;
    queuedAt: Date;
  }[];
  createdAt: Date;
  updatedAt?: Date;
  lastActivity?: Date;
}

export interface PasswordHistoryTypes {
  password: string;
  changedAt: Date;
}

// 소셜 계정 정보 구조
export interface SocialAccountTypes {
  provider: 'google' | 'kakao' | 'naver' | 'local';
  providerId: string;
  socialRefreshToken?: string;
}

export type UserRole = 'user' | 'admin';

// JWT에 담길 최소 사용자 정보
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

export interface EmailTokenPayload extends JwtPayload{
  email: string;
}

// verifyAccessToken 이후 req.user로 들어오는 타입
export type DecodedUser = AccessTokenPayload;

// JWT 발급 시 리턴할 토큰 구조
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenTTL: number;
}

export interface PublicUserProfile {
  name: string;
  email: string;
  profileIcon: string;
  userId: string;
  role: UserRole;
}

export type SafeUserInfo = Omit<UserTypes, '_id' | 'password' | 'passwordHistory' | 'deleteQueue'>;

export type FindUserQueryData = Pick<UserTypes, 'username' | 'email' | "socialAccounts">

export type UpdateUserProfileData = Pick<UserTypes, 'name' | 'profileIcon'>

export interface FindUserQuery {
  input: string;
  inputType: string;
}