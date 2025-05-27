import { Test, TestingModule } from '@nestjs/testing';
import { FastifyReply, FastifyRequest } from 'fastify';

import { AuthController } from '@/auth/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { LoginDto, RegisterDto } from '@/auth/dto/auth.dto';
import { TokenService } from '@/auth/token.service';
import { CreateUserInput, DecodedUser, TokenPair } from '@/auth/types/auth-service.types';

jest.mock('@/auth/utils/set-auth-cookies.util');

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: { registerUser: jest.fn(), loginUser: jest.fn(), refreshTokens: jest.fn() },
        },
        {
          provide: TokenService,
          useValue: {
            verifyRefreshToken: jest.fn(),
            deleteRefreshTokenFromRedis: jest.fn(),
            invalidateAccessToken: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(AuthController);
    authService = moduleRef.get(AuthService);
    tokenService = moduleRef.get(TokenService);
  });

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

      authService.loginUser.mockResolvedValue(tokens);

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

      tokenService.verifyRefreshToken.mockResolvedValue({ id: 1, rememberMe: false });
      tokenService.deleteRefreshTokenFromRedis.mockResolvedValue(undefined);
      tokenService.invalidateAccessToken.mockResolvedValue(undefined);

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

      tokenService.verifyRefreshToken.mockRejectedValue(new Error('verify failed'));

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

      authService.refreshTokens.mockResolvedValue(tokens);

      const result = await controller.refresh(refreshToken);

      expect(authService.refreshTokens).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(tokens);
    });
  });

  describe('checkSession', () => {
    it('CurrentUserDecorator를 통해 유저 객체를 반환해야 합니다', () => {
      const user: DecodedUser = { id: 1, email: 'test@email.com', role: 'user' };
      const result = controller.checkSession(user);
      expect(result).toBe(user);
    });
  });
});
