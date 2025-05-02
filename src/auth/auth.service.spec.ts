import '../../test/utils/bcrypt.mock';

import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  UsernameAlreadyExistsException,
} from '@/common/exceptions/auth.exceptions';
import { UserNotFoundException } from '@/common/exceptions/user.exceptions';

import { setupAuthServiceTest } from '../../test/utils/auth-service.test-helper';

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

      const { authService, tokenService } = await setupAuthServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(mockUser),
        },
      });

      const spy = jest.spyOn(tokenService, 'generateTokens').mockResolvedValue(mockTokens);

      const result = await authService.loginUser({
        username: 'test',
        password: 'password1234',
        rememberMe: false,
      });

      expect(result).toEqual(mockTokens);
      expect(spy).toHaveBeenCalledWith(
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

      const { authService, tokenService } = await setupAuthServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(mockUser),
        },
        config: {
          'auth.rememberRefreshTokenTtl': 2592000,
        },
      });

      jest.spyOn(tokenService, 'generateTokens').mockResolvedValue(mockTokens);

      const result = await authService.loginUser({
        username: 'test',
        password: 'password1234',
        rememberMe: true,
      });

      expect(result.refreshTokenTtl).toBe(2592000);
    });
  });

  describe('refreshTokens', () => {
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

      const { authService, tokenService } = await setupAuthServiceTest({
        tokenService: {
          verifyRefreshToken: jest.fn().mockResolvedValue({ id: 1, rememberMe: false }),
          getRemainingTtl: jest.fn().mockResolvedValue(500),
        },
        userRepo: {
          findOne: jest.fn().mockResolvedValue(user),
        },
      });

      const spy = jest.spyOn(tokenService, 'generateTokens').mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        refreshTokenTtl: 604800,
      });

      const result = await authService.refreshTokens('refresh-token');

      expect(spy).toHaveBeenCalledWith(
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

      const { authService, tokenService } = await setupAuthServiceTest({
        tokenService: {
          verifyRefreshToken: jest.fn().mockResolvedValue({ id: 1, rememberMe: true }),
          getRemainingTtl: jest.fn().mockResolvedValue(999999),
        },
        userRepo: {
          findOne: jest.fn().mockResolvedValue(user),
        },
      });

      const spy = jest.spyOn(tokenService, 'generateTokens').mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        refreshTokenTtl: 2592000,
      });

      const result = await authService.refreshTokens('refresh-token');

      expect(spy).toHaveBeenCalledWith(
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
