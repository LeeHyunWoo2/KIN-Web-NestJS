import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyReply, FastifyRequest } from 'fastify';

import { AuthController } from '@/auth/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { LoginDto, RegisterDto } from '@/auth/dto/auth.dto';
import { TokenService } from '@/auth/token.service';
import { CreateUserInput, DecodedUser, TokenPair } from '@/auth/types/auth-service.types';

import { createMockConfigService, MockConfigType } from '../../test/utils/config.mock';

jest.mock('@/auth/utils/set-auth-cookies.util');

interface SetupOptions {
  authService?: Partial<AuthService>;
  tokenService?: Partial<TokenService>;
  config?: MockConfigType;
}

const setupAuthControllerTest = async (
  overrides: SetupOptions = {},
): Promise<{
  controller: AuthController;
  authService: jest.Mocked<AuthService>;
  tokenService: jest.Mocked<TokenService>;
  config: ConfigService;
}> => {
  const authService = {
    registerUser: jest.fn(),
    loginUser: jest.fn(),
    refreshTokens: jest.fn(),
    ...overrides.authService,
  } as unknown as jest.Mocked<AuthService>;

  const tokenService = {
    verifyRefreshToken: jest.fn(),
    deleteRefreshTokenFromRedis: jest.fn(),
    invalidateAccessToken: jest.fn(),
    ...overrides.tokenService,
  } as unknown as jest.Mocked<TokenService>;

  const defaultConfig = {
    'app.nodeEnv': 'test',
  };
  const config = createMockConfigService({
    ...defaultConfig,
    ...(overrides.config || {}),
  });

  const moduleRef: TestingModule = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [
      { provide: AuthService, useValue: authService },
      { provide: TokenService, useValue: tokenService },
      { provide: ConfigService, useValue: config },
    ],
  }).compile();

  return {
    controller: moduleRef.get(AuthController),
    authService,
    config: moduleRef.get(ConfigService),
    tokenService,
  };
};

describe('AuthController', () => {
  describe('register', () => {
    it('회원가입을 처리해야 합니다', async () => {
      const registerDto: RegisterDto = {
        username: 'testuser',
        email: 'test@email.com',
        password: 'Password1!',
        name: 'Test User',
        marketingConsent: true,
      };

      const expectedInput: CreateUserInput = {
        username: registerDto.username,
        email: registerDto.email,
        password: registerDto.password,
        name: registerDto.name,
        marketingConsent: registerDto.marketingConsent,
      };

      const { controller, authService } = await setupAuthControllerTest();

      await controller.register(registerDto);

      expect(authService.registerUser).toHaveBeenCalledWith(expectedInput);
    });
  });

  describe('login', () => {
    it('로그인 시 TokenPair를 반환해야 합니다', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'Password1!',
        rememberMe: true,
      };

      const tokens: TokenPair = {
        accessToken: 'access',
        refreshToken: 'refresh',
        refreshTokenTtl: 3600,
      };

      const { controller, authService } = await setupAuthControllerTest({
        authService: { loginUser: jest.fn().mockResolvedValue(tokens) },
      });

      const result = await controller.login(loginDto);

      expect(authService.loginUser).toHaveBeenCalledWith({
        username: loginDto.username,
        password: loginDto.password,
        rememberMe: loginDto.rememberMe,
      });
      expect(result).toEqual(tokens);
    });
  });

  describe('logout', () => {
    it('refreshToken과 accessToken을 검증 및 삭제해야 합니다', async () => {
      const refreshToken = 'refresh-token';
      const accessToken = 'access-token';
      const req = { cookies: { accessToken } } as unknown as FastifyRequest;
      const reply = { clearCookie: jest.fn() } as unknown as FastifyReply;

      const { controller, tokenService } = await setupAuthControllerTest({
        tokenService: {
          verifyRefreshToken: jest.fn().mockResolvedValue({ id: 1, rememberMe: false }),
          deleteRefreshTokenFromRedis: jest.fn().mockResolvedValue(undefined),
          invalidateAccessToken: jest.fn().mockResolvedValue(undefined),
        },
      });

      await controller.logout(refreshToken, req, reply);

      expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(tokenService.deleteRefreshTokenFromRedis).toHaveBeenCalledWith(1);
      expect(tokenService.invalidateAccessToken).toHaveBeenCalledWith(accessToken);
      expect(reply.clearCookie).toHaveBeenCalledWith('accessToken');
      expect(reply.clearCookie).toHaveBeenCalledWith('refreshToken');
    });

    it('토큰 예외가 발생해도 쿠키는 항상 삭제되어야 합니다', async () => {
      const refreshToken = 'refresh-token';
      const req = { cookies: {} } as unknown as FastifyRequest;
      const reply = { clearCookie: jest.fn() } as unknown as FastifyReply;

      const { controller } = await setupAuthControllerTest({
        tokenService: {
          verifyRefreshToken: jest.fn().mockRejectedValue(new Error('verify failed')),
        },
      });

      await controller.logout(refreshToken, req, reply);

      expect(reply.clearCookie).toHaveBeenCalledWith('accessToken');
      expect(reply.clearCookie).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('refresh', () => {
    it('refreshToken으로 새로운 TokenPair를 반환해야 합니다', async () => {
      const refreshToken = 'refresh-token';

      const tokens: TokenPair = {
        accessToken: 'newAccess',
        refreshToken: 'newRefresh',
        refreshTokenTtl: 7200,
      };

      const { controller, authService } = await setupAuthControllerTest({
        authService: { refreshTokens: jest.fn().mockResolvedValue(tokens) },
      });

      const result = await controller.refresh(refreshToken);

      expect(authService.refreshTokens).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(tokens);
    });
  });

  describe('checkSession', () => {
    it('CurrentUserDecorator를 통해 유저 객체를 반환해야 합니다', async () => {
      const user: DecodedUser = { id: 1, email: 'test@email.com', role: 'user' };

      const { controller } = await setupAuthControllerTest();

      const result = controller.checkSession(user);
      expect(result).toBe(user);
    });
  });
});
