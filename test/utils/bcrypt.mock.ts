export const mockBcrypt = {
  hash: jest.fn().mockImplementation((password: string) => `hashed-${password}`),
  compare: jest.fn().mockImplementation((raw, hashed) => hashed === `hashed-${raw}`),
  compareSync: jest.fn().mockImplementation((raw, hashed) => hashed === `hashed-${raw}`),
};

jest.mock('bcryptjs', () => mockBcrypt);
