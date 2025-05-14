import '../../test/utils/bcrypt.mock';

import { getRepositoryToken } from '@mikro-orm/nestjs';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from '@/auth/auth.service';
import { TokenService } from '@/auth/token.service';
import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  RefreshTokenMissingException,
  UsernameAlreadyExistsException,
  UserNotFoundException,
} from '@/common/exceptions';
import { SocialAccount } from '@/user/entity/social-account.entity';
import { User } from '@/user/entity/user.entity';

import { createMockConfigService, MockConfigType } from '../../test/utils/config.mock';
import { createMockRepository, MockRepository } from '../../test/utils/repository.mock';

interface SetupOptions {
  userRepo?: Partial<MockRepository<User>>;
  socialRepo?: Partial<MockRepository<SocialAccount>>;
  tokenService?: Partial<TokenService>;
  config?: MockConfigType;
}

const setupAuthServiceTest = async (
  overrides: SetupOptions = {},
): Promise<{
  authService: AuthService;
  userRepository: MockRepository<User>;
  socialAccountRepository: MockRepository<SocialAccount>;
  config: ConfigService;
  tokenService: TokenService;
}> => {
  const userRepository = {
    ...createMockRepository<User>(),
    ...overrides.userRepo,
  };

  const socialAccountRepository = {
    ...createMockRepository<SocialAccount>(),
    ...overrides.socialRepo,
  };

  const defaultConfig = {
    'auth.refreshTokenTtl': 604800,
    'auth.rememberRefreshTokenTtl': 2592000,
    'auth.refreshTokenRenewThreshold': 10800,
    'auth.rememberRefreshTokenRenewThreshold': 259200,
  };
  const config = createMockConfigService({
    ...defaultConfig,
    ...(overrides.config || {}),
  });

  const tokenService = {
    generateTokens: jest.fn(),
    verifyRefreshToken: jest.fn(),
    getRemainingTtl: jest.fn(),
    ...overrides.tokenService,
  } as unknown as TokenService;

  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: getRepositoryToken(User), useValue: userRepository },
      { provide: getRepositoryToken(SocialAccount), useValue: socialAccountRepository },
      { provide: ConfigService, useValue: config },
      { provide: TokenService, useValue: tokenService },
    ],
  }).compile();

  return {
    authService: moduleRef.get(AuthService),
    userRepository,
    socialAccountRepository,
    config: moduleRef.get(ConfigService),
    tokenService,
  };
};

describe('AuthService', () => {
  describe('registerUser', () => {
    it('아이디가 중복이면 UsernameAlreadyExistsException 을 던져야 합니다', async () => {
      const existing = { username: 'user', email: 'user@email.com' };

      const { authService } = await setupAuthServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(existing),
        },
      });

      await expect(
        authService.registerUser({
          username: 'user',
          email: 'new@email.com',
          password: '1234',
          name: 'Test',
        }),
      ).rejects.toThrow(UsernameAlreadyExistsException);
    });
    it('이메일이 중복이면 EmailAlreadyExistsException 을 던져야 합니다', async () => {
      const existing = { username: 'user', email: 'user@email.com' };

      const { authService } = await setupAuthServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(existing),
        },
      });

      await expect(
        authService.registerUser({
          username: 'newuser',
          email: 'user@email.com',
          password: '1234',
          name: 'Test',
        }),
      ).rejects.toThrow(EmailAlreadyExistsException);
    });

    it('중복이 없으면 user와 socialAccount를 생성해야 합니다', async () => {
      const persist = jest.fn();
      const userCreate = jest.fn().mockReturnValue({});
      const socialCreate = jest.fn().mockReturnValue({});

      const { authService } = await setupAuthServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(null),
          create: userCreate,
          getEntityManager: jest.fn().mockReturnValue({ persistAndFlush: persist }),
        },
        socialRepo: {
          create: socialCreate,
          getEntityManager: jest.fn().mockReturnValue({ persistAndFlush: persist }),
        },
      });

      await authService.registerUser({
        username: 'newuser',
        email: 'test@email.com',
        password: '1234',
        name: 'Test',
      });

      expect(userCreate).toHaveBeenCalled();
      expect(socialCreate).toHaveBeenCalled();
      expect(persist).toHaveBeenCalledTimes(2);
    });
  });
  describe('loginUser', () => {
    it('유저가 없으면 InvalidCredentialsException을 던져야 합니다', async () => {
      const { authService } = await setupAuthServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(null),
        },
      });

      await expect(
        authService.loginUser({
          username: 'ghost',
          password: '1234',
          rememberMe: false,
        }),
      ).rejects.toThrow(InvalidCredentialsException);
    });

    it('비밀번호가 다르면 InvalidCredentialsException을 던져야 합니다', async () => {
      const mockUser = {
        id: 1,
        email: 'test@email.com',
        password: 'hashed-other',
        role: 'user',
      };

      const { authService } = await setupAuthServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(mockUser),
        },
      });

      await expect(
        authService.loginUser({
          username: 'test',
          password: 'wrong-password',
          rememberMe: false,
        }),
      ).rejects.toThrow(InvalidCredentialsException);
    });

    it('비밀번호가 맞으면 토큰을 발급해야 합니다', async () => {
      const mockUser = {
        id: 1,
        email: 'test@email.com',
        password: 'hashed-password1234',
        role: 'user',
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        refreshTokenTtl: 604800,
      };

      const generateTokensMock = jest.fn().mockResolvedValue(mockTokens);

      const { authService } = await setupAuthServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(mockUser),
        },
        tokenService: {
          generateTokens: generateTokensMock,
        },
      });

      const result = await authService.loginUser({
        username: 'test',
        password: 'password1234',
        rememberMe: false,
      });

      expect(result).toEqual(mockTokens);
      expect(generateTokensMock).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
        604800,
      );
    });
    it('rememberMe가 true이면 rememberRefreshTokenTtl을 사용해야 합니다', async () => {
      const mockUser = {
        id: 1,
        email: 'test@email.com',
        password: 'hashed-password1234',
        role: 'user',
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        refreshTokenTtl: 2592000,
      };

      const { authService } = await setupAuthServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(mockUser),
        },
        config: {
          'auth.rememberRefreshTokenTtl': 2592000,
        },
        tokenService: {
          generateTokens: jest.fn().mockResolvedValue(mockTokens),
        },
      });

      const result = await authService.loginUser({
        username: 'test',
        password: 'password1234',
        rememberMe: true,
      });

      expect(result.refreshTokenTtl).toBe(2592000);
    });
  });

  describe('refreshTokens', () => {
    it('refreshToken이 없으면 RefreshTokenMissingException을 던져야 합니다.', async () => {
      const { authService } = await setupAuthServiceTest();
      await expect(authService.refreshTokens('')).rejects.toThrow(RefreshTokenMissingException);
    });
    it('유저가 없으면 UserNotFoundException을 던져야 합니다', async () => {
      const { authService } = await setupAuthServiceTest({
        tokenService: {
          verifyRefreshToken: jest.fn().mockResolvedValue({ id: 1, rememberMe: false }),
          getRemainingTtl: jest.fn().mockResolvedValue(100),
        },
        userRepo: {
          findOne: jest.fn().mockResolvedValue(null),
        },
      });

      await expect(authService.refreshTokens('refresh-token')).rejects.toThrow(
        UserNotFoundException,
      );
    });

    it('TTL이 threshold보다 작으면 새 토큰 TTL로 발급해야 합니다', async () => {
      const user = { id: 1, email: 'test@email.com', role: 'user' };

      const mockGenerateTokens = jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        refreshTokenTtl: 604800,
      });

      const { authService } = await setupAuthServiceTest({
        tokenService: {
          verifyRefreshToken: jest.fn().mockResolvedValue({ id: 1, rememberMe: false }),
          getRemainingTtl: jest.fn().mockResolvedValue(500),
          generateTokens: mockGenerateTokens,
        },
        userRepo: {
          findOne: jest.fn().mockResolvedValue(user),
        },
      });

      const result = await authService.refreshTokens('refresh-token');

      expect(mockGenerateTokens).toHaveBeenCalledWith(
        {
          id: 1,
          email: user.email,
          role: user.role,
        },
        604800,
      );

      expect(result.accessToken).toBe('access-token');
    });

    it('TTL이 threshold 이상이면 기존 TTL로 재사용해야 합니다', async () => {
      const user = { id: 1, email: 'test@email.com', role: 'user' };

      const generateTokensMock = jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        refreshTokenTtl: 2592000,
      });

      const { authService } = await setupAuthServiceTest({
        tokenService: {
          verifyRefreshToken: jest.fn().mockResolvedValue({ id: 1, rememberMe: true }),
          getRemainingTtl: jest.fn().mockResolvedValue(999999),
          generateTokens: generateTokensMock,
        },
        userRepo: {
          findOne: jest.fn().mockResolvedValue(user),
        },
      });

      const result = await authService.refreshTokens('refresh-token');

      expect(generateTokensMock).toHaveBeenCalledWith(
        {
          id: 1,
          email: user.email,
          role: user.role,
        },
        999999,
      );

      expect(result.refreshToken).toBe('refresh-token');
    });
  });
});
