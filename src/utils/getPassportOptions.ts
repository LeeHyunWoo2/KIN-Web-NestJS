export type Provider = 'google' | 'kakao' | 'naver';
export type SocialMode = 'login' | 'login-callback' | 'link' | 'link-callback';

interface PassportOptionResult {
  strategy: string;
  options: Record<string, any>;
}


export const getPassportOptions = (
    provider: Provider,
    mode: SocialMode = 'login'
): PassportOptionResult => {
  const isLink = mode === 'link' || mode === 'link-callback';
  const strategy = isLink ? `${provider}-link` : provider;

  const commonOptions = {
    scope: getScopeForProvider(provider),
    accessType: 'offline',
    prompt: 'consent',
  };

  return {
    strategy,
    options: commonOptions,
  };
};

const getScopeForProvider = (provider: Provider): string[] => {
  switch (provider) {
    case 'google':
      return ['profile', 'email'];
    case 'kakao':
      return ['account_email', 'profile_nickname'];
    case 'naver':
      return ['name', 'email'];
    default:
      throw new Error(`지원하지 않는 플랫폼 : ${provider}`);
  }
};