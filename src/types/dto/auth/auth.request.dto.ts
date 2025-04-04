export interface RegisterRequestDto {
  id: string;
  email: string;
  password: string;
  name: string;
  marketingConsent: boolean;
}

export interface LoginRequestDto {
  id: string;
  password: string;
  rememberMe: boolean; // 기본값 false
}

export interface ChangeToLocalAccountRequestDto {
  newPassword: string;
  email: string;
}

export interface SocialLinkCallbackDto {
  accessToken: string;
  provider: 'google' | 'kakao' | 'naver';
}