export interface MockConfigService {
  get: jest.Mock;
  getOrThrow: jest.Mock;
}

export type MockConfigType = Record<string, string | number>;

export const createMockConfigService = (overrides: MockConfigType = {}): MockConfigService => ({
  get: jest.fn((key: string) => overrides[key]),
  getOrThrow: jest.fn((key: string) => {
    if (!(key in overrides)) throw new Error(`Missing config: ${key}`);
    return overrides[key];
  }),
});
