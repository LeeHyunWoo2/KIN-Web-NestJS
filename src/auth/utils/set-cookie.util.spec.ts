import { setCookie } from '@/auth/utils/set-cookie.util';

jest.mock('@/config/global-config.service', () => ({
  getConfig: jest.fn(),
}));

import { getConfig } from '@/config/global-config.service';

describe('setCookie', () => {
  const mockReply = {
    setCookie: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('production 환경에서 secure 와 domain이 적용되어야 합니다.', () => {
    (getConfig as jest.Mock).mockReturnValue({
      get: (key: string) => (key === 'app.nodeEnv' ? 'production' : undefined),
    });

    setCookie(mockReply, 'testCookie', 'testValue', { maxAge: 123 });

    expect(mockReply.setCookie).toHaveBeenCalledWith(
      'testCookie',
      'testValue',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        domain: 'noteapp.org',
        maxAge: 123,
      }),
    );
  });

  it('개발 환경에서는 환경에서 secure 와 domain이 적용되지 않아야 합니다.', () => {
    (getConfig as jest.Mock).mockReturnValue({
      get: (key: string) => (key === 'app.nodeEnv' ? 'development' : undefined),
    });

    setCookie(mockReply, 'testCookie', 'testValue');

    expect(mockReply.setCookie).toHaveBeenCalledWith(
      'testCookie',
      'testValue',
      expect.objectContaining({
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        domain: undefined,
      }),
    );
  });
});
