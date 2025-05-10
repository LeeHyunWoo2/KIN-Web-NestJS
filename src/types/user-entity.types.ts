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

export type UserRole = 'user' | 'admin';
