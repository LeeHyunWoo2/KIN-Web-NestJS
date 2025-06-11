export interface MockRepository<T = unknown> {
  find?: jest.Mock<Promise<T[]>, unknown[]>;
  findOne: jest.Mock<Promise<T | null>, unknown[]>;
  findAll?: jest.Mock<Promise<T[]>, unknown[]>;
  findAndCount?: jest.Mock<Promise<[T[], number]>, unknown[]>;
  create: jest.Mock<T, [Partial<T>?]>;
  getEntityManager: jest.Mock<
    {
      persistAndFlush: jest.Mock<Promise<void>, [T]>;
      flush: jest.Mock<Promise<void>, []>;
      removeAndFlush: jest.Mock<Promise<void>, [T]>;
    },
    []
  >;
  persistAndFlush?: jest.Mock<Promise<void>, [T]>;
  flush?: jest.Mock<Promise<void>, []>;
  nativeInsert?: jest.Mock<Promise<void>, [T]>;
  removeAndFlush?: jest.Mock<Promise<void>, [T]>;
}

export const createMockRepository = <T = unknown>(
  overrides: Partial<MockRepository<T>> = {},
): MockRepository<T> => {
  const defaultMocks: MockRepository<T> = {
    findOne: jest.fn() as jest.Mock<Promise<T | null>, unknown[]>,
    create: jest.fn() as jest.Mock<T, [Partial<T>?]>,
    getEntityManager: jest.fn().mockReturnValue({
      persistAndFlush: jest.fn() as jest.Mock<Promise<void>, [T]>,
      flush: jest.fn() as jest.Mock<Promise<void>, []>,
      removeAndFlush: jest.fn() as jest.Mock<Promise<void>, [T]>,
    }) as jest.Mock<
      {
        persistAndFlush: jest.Mock<Promise<void>, [T]>;
        flush: jest.Mock<Promise<void>, []>;
        removeAndFlush: jest.Mock<Promise<void>, [T]>;
      },
      []
    >,
  };

  return { ...defaultMocks, ...overrides };
};
