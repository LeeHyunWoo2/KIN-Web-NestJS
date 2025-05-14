import { ArgumentsHost, HttpException } from '@nestjs/common';

import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import * as logModule from '@/common/logger/log-structured-error';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  const mockRequest = { url: '/test', method: 'GET' };
  const mockResponse = { status: jest.fn().mockReturnThis(), send: jest.fn() };

  const createMockHost = (req = mockRequest, res = mockResponse): ArgumentsHost =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    }) as unknown as ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    jest.spyOn(logModule, 'logStructuredError').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  it('HttpException인 경우 status와 getResponse 값을 반환해야 합니다', () => {
    const exception = new HttpException(
      { code: 'EXCEPTION_CODE', message: 'Test error', detail: 'More info' },
      400,
    );
    filter.catch(exception, createMockHost());

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.send).toHaveBeenCalledWith({
      code: 'EXCEPTION_CODE',
      message: 'Test error',
      details: { code: 'EXCEPTION_CODE', message: 'Test error', detail: 'More info' },
    });
  });

  it('string 형태 response인 경우 SERVER_ERROR 코드로 반환해야 합니다', () => {
    const exception = new HttpException('string error', 400);
    filter.catch(exception, createMockHost());

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.send).toHaveBeenCalledWith({
      code: 'SERVER_ERROR',
      message: 'string error',
    });
  });

  it('HttpException이 아닌 Error 객체면 500으로 반환해야 합니다', () => {
    const exception = new Error('unexpected error');
    filter.catch(exception, createMockHost());

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.send).toHaveBeenCalledWith({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'unexpected error',
    });
  });

  it('HttpException도 Error도 아닌 값이면 Unknown error로 반환해야 합니다', () => {
    filter.catch(12345 as any, createMockHost());

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.send).toHaveBeenCalledWith({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unknown error',
    });
  });
  it('response에서 code가 없으면 SERVER_ERROR로 대체해야 합니다', () => {
    const exception = new HttpException({ message: 'Test error', detail: 'Extra detail' }, 400);
    filter.catch(exception, createMockHost());

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.send).toHaveBeenCalledWith({
      code: 'SERVER_ERROR',
      message: 'Test error',
      details: undefined,
    });
  });
  it('response에서 message가 없으면 Unexpected error로 대체해야 합니다', () => {
    const exception = new HttpException({ code: 'TEST_CODE', detail: 'Extra detail' }, 400);
    filter.catch(exception, createMockHost());

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.send).toHaveBeenCalledWith({
      code: 'TEST_CODE',
      message: 'Unexpected error',
      details: undefined,
    });
  });
});
