export interface MockRedis {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
  ttl: jest.Mock;
  expire: jest.Mock;
}

export const createMockRedis = (): MockRedis => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  ttl: jest.fn(),
  expire: jest.fn(),
});
