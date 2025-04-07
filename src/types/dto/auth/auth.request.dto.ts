export interface RegisterRequestDto {
  username: string;
  email: string;
  password: string;
  name: string;
  marketingConsent: boolean;
}

export interface LoginRequestDto {
  username: string;
  password: string;
  rememberMe: boolean; // 기본값 false
}

export interface EmailTokenRequestDto {
  email: string;
}