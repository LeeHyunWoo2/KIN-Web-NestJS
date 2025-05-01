export interface MockConfigService {
  get: jest.Mock;
  getOrThrow: jest.Mock;
}

export const createMockConfigService = (
  overrides: Record<string, string | number> = {},
): MockConfigService => ({
  get: jest.fn((key: string) => overrides[key]),
  getOrThrow: jest.fn((key: string) => {
    if (!(key in overrides)) throw new Error(`Missing config: ${key}`);
    return overrides[key];
  }),
});
