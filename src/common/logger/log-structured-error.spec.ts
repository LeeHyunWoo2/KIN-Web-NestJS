import { HttpException, LoggerService } from '@nestjs/common';

import { logStructuredError, setLogger } from '@/common/logger/log-structured-error';

describe('logStructuredError', () => {
  const mockLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as LoggerService;

  const mockRequest = {
    requestId: 'test-request-id',
    url: '/test',
    method: 'GET',
    user: { id: 123 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setLogger(mockLogger);
  });

  it.each([
    [500, 'error'],
    [503, 'error'],
    [401, 'warn'],
    [403, 'warn'],
    [404, 'warn'],
    [200, 'log'],
    [201, 'log'],
  ])('status %d일 때 %s 레벨로 로깅해야 합니다', (statusCode, expectedLevel) => {
    const exception = new HttpException('Test error', statusCode);

    logStructuredError(exception, mockRequest as any);

    expect(mockLogger[expectedLevel]).toHaveBeenCalledWith(
      expect.objectContaining({
        status: statusCode,
        message: 'Test error',
        path: '/test',
        method: 'GET',
        user: 123,
      }),
    );
  });
  it.each([
    [null, 'null'],
    [undefined, 'undefined'],
    ['', 'Unknown error'],
  ])('error 값이 %p이면 message가 "%s" 이어야 합니다', (input, expectedMessage) => {
    logStructuredError(input as any, mockRequest as any);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 500,
        message: expectedMessage,
      }),
    );
  });
  it('Error 객체가 아닌 경우도 처리해야 합니다', () => {
    logStructuredError('non-error value', mockRequest as any);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 500,
        message: 'non-error value',
      }),
    );
  });

  it('requestId, user가 없는 경우 default 값으로 로깅해야 합니다', () => {
    const exception = new Error('Fallback error');

    const req = { url: '/test', method: 'POST' };
    logStructuredError(exception, req as any);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'unknown',
        user: 'anonymous',
        path: '/test',
        method: 'POST',
      }),
    );
  });
});
