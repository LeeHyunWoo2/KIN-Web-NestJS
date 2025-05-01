export interface MockRepository<T = any> {
  findOne: jest.Mock;
  findAll?: jest.Mock;
  findAndCount?: jest.Mock;
  create: jest.Mock;
  getEntityManager: jest.Mock;
  persistAndFlush?: jest.Mock;
  flush?: jest.Mock;
  nativeInsert?: jest.Mock;
  removeAndFlush?: jest.Mock;
}

export const createMockRepository = <T = any>(
  overrides: Partial<MockRepository<T>> = {},
): MockRepository<T> => ({
  findOne: jest.fn(),
  create: jest.fn(),
  getEntityManager: jest.fn().mockReturnValue({
    persistAndFlush: jest.fn(),
    flush: jest.fn(),
    removeAndFlush: jest.fn(),
  }),
  ...overrides,
});
