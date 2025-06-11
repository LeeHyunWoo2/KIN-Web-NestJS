import { CallHandler, ExecutionContext } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { of } from 'rxjs';

import { TokenPair } from '@/auth/types/auth-service.types';
import * as setAuthCookiesUtil from '@/auth/utils/set-auth-cookies.util';

import { SetAuthCookiesInterceptor } from './set-auth-cookies.interceptor';

jest.mock('@/auth/utils/set-auth-cookies.util', () => ({
  setAuthCookies: jest.fn(),
}));

describe('SetAuthCookiesInterceptor', () => {
  let interceptor: SetAuthCookiesInterceptor;
  let mockContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    interceptor = new SetAuthCookiesInterceptor();

    mockReply = {};
    mockContext = {
      switchToHttp: () => ({
        getResponse: jest.fn().mockReturnValue(mockReply),
      }),
    } as unknown as ExecutionContext;

    mockCallHandler = {
      handle: jest.fn(() =>
        of({
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          refreshTokenTtl: 7200,
        }),
      ),
    };

    jest.clearAllMocks();
  });

  it('유효한 데이터가 있을 때 setAuthCookies를 올바른 토큰과 함께 호출해야 합니다', (done) => {
    const tokens: TokenPair = {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      refreshTokenTtl: 7200,
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe(() => {
      expect(setAuthCookiesUtil.setAuthCookies).toHaveBeenCalledTimes(1);
      expect(setAuthCookiesUtil.setAuthCookies).toHaveBeenCalledWith({
        reply: mockReply,
        tokens,
      });
      done();
    });
  });

  it('토큰이 없으면 setAuthCookies를 호출하지 않아야 합니다', (done) => {
    mockCallHandler.handle = jest.fn(() => of({}));

    interceptor.intercept(mockContext, mockCallHandler).subscribe(() => {
      expect(setAuthCookiesUtil.setAuthCookies).not.toHaveBeenCalled();
      done();
    });
  });

  it('accessToken 또는 refreshToken이 없으면 setAuthCookies를 호출하지 않아야 합니다', (done) => {
    mockCallHandler.handle = jest.fn(() => of({ accessToken: 'test-access-token' }));

    interceptor.intercept(mockContext, mockCallHandler).subscribe(() => {
      expect(setAuthCookiesUtil.setAuthCookies).not.toHaveBeenCalled();
      done();
    });
  });

  it('응답을 수정하지 않고 그대로 전달해야 합니다', (done) => {
    const tokens: TokenPair = {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      refreshTokenTtl: 7200,
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual(tokens);
      done();
    });
  });
});
