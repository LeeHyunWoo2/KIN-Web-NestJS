import { SocialAccount, UserRole } from '@/types/user-entity.types';

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

export interface CreateSocialUserInput {
  provider: 'google' | 'kakao' | 'naver';
  providerId: string;
  email: string;
  name: string;
  profileIcon?: string;
  socialRefreshToken?: string;
}

export interface UserInfoResult {
  username?: string;
  name: string;
  email: string;
  profileIcon: string;
  role: UserRole;
  createdAt: Date;
}

export interface UpdateUserProfileData {
  name?: string;
  profileIcon?: string;
}

export interface UpdateUserInput {
  id: number;
  data: UpdateUserProfileData;
}

export interface DeleteUserInput {
  id: number;
  accessToken?: string;
  refreshToken?: string;
}

export interface FindUserQuery {
  input: string;
  inputType: 'username' | 'email';
}

export interface FindUserQueryData {
  username?: string;
  email?: string;
  socialAccounts?: SocialAccount[];
  signal: 'user_found' | 'user_not_found';
  accountType?: 'Local' | 'SNS';
}

export interface PublicUserProfile {
  id: number;
  name: string;
  email: string;
  profileIcon: string;
  role: UserRole;
}
