export interface PasswordHistoryTypes {
  password: string;
  createdAt: Date;
}

export type SocialProviderTypes = 'local' | 'google' | 'kakao' | 'naver';

export interface SocialAccountTypes {
  provider: SocialProviderTypes;
  providerId: string;
  socialRefreshToken?: string;
}

export type UserRole = 'user' | 'admin';

export interface DeleteQueueTypes {
  url: string;
  queuedAt: Date;
}

export interface DecodedUserTypes {
  _id: string;
  email: string;
  role: UserRole;
}

export interface PublicUserDataTypes {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profileIcon?: string;
  socialAccounts?: {
    provider: string;
    providerId: string;
  }[];
}

export interface UserTypes {
  id: string;
  name: string;
  email: string;
  password: string;
  passwordHistory?: PasswordHistoryTypes[];
  termsAgreed: boolean;
  marketingConsent: boolean;
  socialAccounts: SocialAccountTypes[];
  role: UserRole;
  profileIcon: string;
  deleteQueue: DeleteQueueTypes[];
  createdAt?: Date;
  lastActivity?: Date;
}