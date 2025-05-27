import { setAuthCookies } from '@/auth/utils/set-auth-cookies.util';

jest.mock('@/auth/utils/set-cookie.util', () => ({
  setCookie: jest.fn(),
}));

jest.mock('@/config/global-config.service', () => ({
  getConfig: jest.fn(),
}));

import { FastifyReply } from 'fastify';

import { TokenPair } from '@/auth/types/auth-service.types';
import { setCookie } from '@/auth/utils/set-cookie.util';
import { getConfig } from '@/config/global-config.service';

describe('setAuthCookies', () => {
  const mockReply = {} as FastifyReply;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('setCookie가 accessToken과 refreshToken을 각각 호출해야 합니다', () => {
    const tokens: TokenPair = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshTokenTtl: 7200,
    };

    (getConfig as jest.Mock).mockReturnValue({
      get: (key: string) => (key === 'auth.accessTokenTtl' ? 1800 : undefined),
    });

    setAuthCookies({ reply: mockReply, tokens });

    expect(setCookie).toHaveBeenCalledTimes(2);
    expect(setCookie).toHaveBeenCalledWith(mockReply, 'accessToken', 'access-token', {
      maxAge: 1800 * 1000,
    });
    expect(setCookie).toHaveBeenCalledWith(mockReply, 'refreshToken', 'refresh-token', {
      maxAge: 7200 * 1000,
    });
  });

  it('accessTokenTtl이 undefined면 default 3600초를 사용해야 합니다', () => {
    const tokens: TokenPair = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshTokenTtl: 7200,
    };

    (getConfig as jest.Mock).mockReturnValue({
      get: () => undefined,
    });

    setAuthCookies({ reply: mockReply, tokens });

    expect(setCookie).toHaveBeenCalledWith(mockReply, 'accessToken', 'access-token', {
      maxAge: 3600 * 1000,
    });
    expect(setCookie).toHaveBeenCalledWith(mockReply, 'refreshToken', 'refresh-token', {
      maxAge: 7200 * 1000,
    });
  });
});
