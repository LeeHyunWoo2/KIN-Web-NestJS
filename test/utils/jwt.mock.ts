export interface MockJwtService {
  sign: jest.Mock;
  signAsync: jest.Mock;
  verify: jest.Mock;
  verifyAsync: jest.Mock;
}

export const createMockJwtService = (): MockJwtService => ({
  sign: jest.fn(),
  signAsync: jest.fn(),
  verify: jest.fn(),
  verifyAsync: jest.fn(),
});
