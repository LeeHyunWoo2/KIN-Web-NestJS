import { FastifyReply, FastifyRequest } from 'fastify';

import { RequestIdMiddleware } from '@/common/middleware/request-id.middleware';

jest.mock('node:crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('generated-uuid'),
}));

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;
  let next: jest.Mock;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
    next = jest.fn();
  });

  it('x-request-id header가 있으면 그대로 사용해야 합니다', () => {
    const req = {
      headers: { 'x-request-id': 'existing-uuid' },
    } as unknown as FastifyRequest;
    const res = { header: jest.fn() } as unknown as FastifyReply;

    middleware.use(req, res, next);

    expect(req.requestId).toBe('existing-uuid');
    expect(res.header).toHaveBeenCalledWith('x-request-id', 'existing-uuid');
    expect(next).toHaveBeenCalled();
  });

  it('x-request-id header가 없으면 randomUUID로 생성해야 합니다', () => {
    const req = { headers: {} } as unknown as FastifyRequest;
    const res = { header: jest.fn() } as unknown as FastifyReply;

    middleware.use(req, res, next);

    expect(req.requestId).toBe('generated-uuid');
    expect(res.header).toHaveBeenCalledWith('x-request-id', 'generated-uuid');
    expect(next).toHaveBeenCalled();
  });
});
