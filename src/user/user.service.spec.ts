import '../../test/utils/bcrypt.mock';

import {
  AlreadyHasLocalAccountException,
  PasswordReusedException,
  SamePasswordUsedException,
  TestAccountMutationException,
  UserNotFoundException,
} from '@/common/exceptions';
import { User } from '@/user/entity/user.entity';
import {
  AddLocalAccountInput,
  CreateSocialUserInput,
  DeleteUserInput,
  ResetPasswordInput,
  UpdateUserInput,
} from '@/user/types/user-service.types';

import { setupUserServiceTest } from '../../test/utils/user-service.test-helper';

describe('UserService', () => {
  describe('getPublicProfile', () => {
    const userId = 1;
    const profile = {
      name: 'Test User',
      email: 'test@example.com',
      profileIcon: 'profile.png',
      id: userId,
      role: 'user',
    };

    it('Redis에 캐시가 있으면 해당 값을 반환해야 합니다', async () => {
      const { userService, redis } = await setupUserServiceTest({
        redis: {
          get: jest.fn().mockResolvedValue(JSON.stringify(profile)),
        },
      });

      const result = await userService.getPublicProfile(userId);
      expect(result).toEqual(profile);
      expect(redis.get).toHaveBeenCalledWith(`publicProfile:${userId}`);
    });

    it('Redis에 캐시가 없고 DB에서 조회되면 캐싱 후 반환해야 합니다', async () => {
      const { userService, redis, userRepository } = await setupUserServiceTest({
        redis: {
          get: jest.fn().mockResolvedValue(null),
          set: jest.fn(),
        },
        userRepo: {
          findOne: jest.fn().mockResolvedValue(profile),
        },
      });

      const result = await userService.getPublicProfile(userId);
      expect(userRepository.findOne).toHaveBeenCalledWith(userId, {
        fields: ['name', 'email', 'profileIcon', 'id', 'role'],
      });
      expect(redis.set).toHaveBeenCalledWith(
        `publicProfile:${userId}`,
        JSON.stringify(profile),
        'EX',
        3600,
      );
      expect(result).toEqual(profile);
    });

    it('DB에도 유저가 없으면 UserNotFoundException을 던져야 합니다', async () => {
      const { userService } = await setupUserServiceTest({
        redis: {
          get: jest.fn().mockResolvedValue(null),
        },
        userRepo: {
          findOne: jest.fn().mockResolvedValue(null),
        },
      });

      await expect(userService.getPublicProfile(userId)).rejects.toThrow(UserNotFoundException);
    });
  });
  describe('getUserInfo', () => {
    const userId = 1;
    const userData = {
      id: userId,
      username: 'tester',
      name: 'Tester',
      email: 'tester@email.com',
      marketingConsent: true,
      role: 'user',
      profileIcon: 'icon.png',
      lastActivity: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      socialAccounts: [],
    };

    it('해당 유저가 존재할 경우 정보를 반환해야 합니다', async () => {
      const { userService, userRepository } = await setupUserServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(userData),
        },
      });

      const result = await userService.getUserInfo(userId);
      expect(result).toEqual(userData);
      expect(userRepository.findOne).toHaveBeenCalledWith(userId, {
        fields: [
          'id',
          'username',
          'name',
          'email',
          'marketingConsent',
          'role',
          'profileIcon',
          'lastActivity',
          'createdAt',
          'updatedAt',
        ],
        populate: ['socialAccounts'],
      });
    });

    it('해당 유저가 존재하지 않으면 예외를 던져야 합니다', async () => {
      const { userService } = await setupUserServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(null),
        },
      });

      await expect(userService.getUserInfo(userId)).rejects.toThrow(UserNotFoundException);
    });
  });
  describe('findUserByInput', () => {
    const user = {
      id: 1,
      username: 'testuser',
      email: 'test@email.com',
    };

    it('유저가 존재하지 않으면 user_not_found를 반환해야 합니다', async () => {
      const { userService } = await setupUserServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(null),
        },
      });

      const result = await userService.findUserByInput({
        input: 'notfound@email.com',
        inputType: 'email',
        fetchUsername: true,
      });

      expect(result).toEqual({ signal: 'user_not_found' });
    });

    it('유저가 존재하고 local 계정이 있으면 username과 Local을 반환해야 합니다', async () => {
      const { userService, userRepository, socialAccountRepository } = await setupUserServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(user),
        },
        socialRepo: {
          findOne: jest.fn().mockResolvedValue({}),
        },
      });

      const result = await userService.findUserByInput({
        input: 'testuser',
        inputType: 'username',
        fetchUsername: true,
      });

      expect(userRepository.findOne).toHaveBeenCalledWith(
        { username: 'testuser' },
        { fields: ['id', 'username', 'email'] },
      );
      expect(socialAccountRepository.findOne).toHaveBeenCalledWith({
        user,
        provider: 'local',
      });
      expect(result).toEqual({
        signal: 'user_found',
        accountType: 'Local',
        username: 'testuser',
      });
    });

    it('유저가 존재하고 local 계정이 없으면 email과 SNS를 반환해야 합니다', async () => {
      const { userService } = await setupUserServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(user),
        },
        socialRepo: {
          findOne: jest.fn().mockResolvedValue(null),
        },
      });

      const result = await userService.findUserByInput({
        input: 'test@email.com',
        inputType: 'email',
        fetchUsername: false,
      });

      expect(result).toEqual({
        signal: 'user_found',
        accountType: 'SNS',
        email: 'test@email.com',
      });
    });
  });
  describe('findUserBySocialAccount', () => {
    const provider = 'google';
    const providerId = 'google-id';
    const mockUser = {
      id: 1,
      email: 'user@email.com',
      role: 'user' as const,
    };

    it('소셜 계정이 존재하지 않으면 null을 반환해야 합니다', async () => {
      const { userService } = await setupUserServiceTest({
        socialRepo: {
          findOne: jest.fn().mockResolvedValue(null),
        },
      });

      const result = await userService.findUserBySocialAccount(provider, providerId);
      expect(result).toBeNull();
    });

    it('소셜 계정은 있으나 user가 null이면 null을 반환해야 합니다', async () => {
      const { userService } = await setupUserServiceTest({
        socialRepo: {
          findOne: jest.fn().mockResolvedValue({ user: null }),
        },
      });

      const result = await userService.findUserBySocialAccount(provider, providerId);
      expect(result).toBeNull();
    });

    it('소셜 계정과 user가 존재하면 AccessTokenPayload를 반환해야 합니다', async () => {
      const { userService, socialAccountRepository } = await setupUserServiceTest({
        socialRepo: {
          findOne: jest.fn().mockResolvedValue({ user: mockUser }),
        },
      });

      const result = await userService.findUserBySocialAccount(provider, providerId);

      expect(socialAccountRepository.findOne).toHaveBeenCalledWith(
        { provider, providerId },
        { populate: ['user'] },
      );

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });
  });
  describe('updateUser', () => {
    const userId = 100;
    const existingUser = {
      id: userId,
      name: 'Old Name',
      email: 'old@email.com',
      profileIcon: 'old-icon.png',
    };

    const updatedInput = {
      name: 'New Name',
      profileIcon: 'new-icon.png',
    };

    it('유저가 존재하지 않으면 예외를 던져야 합니다', async () => {
      const { userService } = await setupUserServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(null),
        },
      });
      const input: UpdateUserInput = {
        id: userId,
        data: updatedInput,
      };
      await expect(userService.updateUser(input)).rejects.toThrow(UserNotFoundException);
    });

    it('테스트 계정이면 예외를 던져야 합니다', async () => {
      const { userService } = await setupUserServiceTest({});
      const input: UpdateUserInput = {
        id: 123456789,
        data: updatedInput,
      };
      await expect(userService.updateUser(input)).rejects.toThrow(
        new Error('테스트 계정은 변경할 수 없습니다.'),
      );
    });

    it('Redis 캐시가 존재할 경우 병합해서 저장해야 합니다', async () => {
      const cached = {
        name: 'Old Name',
        email: 'old@email.com',
        profileIcon: 'old-icon.png',
        id: userId,
        role: 'user',
      };
      const ttl = 1000;

      const redisSetMock = jest.fn();
      const { userService, redis } = await setupUserServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue({ ...existingUser }),
          getEntityManager: jest.fn().mockReturnValue({ persistAndFlush: jest.fn() }),
        },
        redis: {
          get: jest.fn().mockResolvedValue(JSON.stringify(cached)),
          ttl: jest.fn().mockResolvedValue(ttl),
          set: redisSetMock,
          expire: jest.fn(),
        },
      });
      const input: UpdateUserInput = {
        id: userId,
        data: updatedInput,
      };
      const result = await userService.updateUser(input);

      expect(redisSetMock).toHaveBeenCalledWith(
        `publicProfile:${userId}`,
        JSON.stringify({ ...cached, ...updatedInput }),
      );
      expect(redis.expire).toHaveBeenCalledWith(`publicProfile:${userId}`, ttl);
      expect(result).toEqual({ ...cached, ...updatedInput });
    });

    it('Redis 캐시가 없을 경우 새로 캐시를 생성해야 합니다', async () => {
      const redisSetMock = jest.fn();

      const { userService } = await setupUserServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue({ ...existingUser }),
          getEntityManager: jest.fn().mockReturnValue({ persistAndFlush: jest.fn() }),
        },
        redis: {
          get: jest.fn().mockResolvedValue(null),
          ttl: jest.fn().mockResolvedValue(-2),
          set: redisSetMock,
          expire: jest.fn(),
        },
      });
      const input: UpdateUserInput = {
        id: userId,
        data: updatedInput,
      };
      const result = await userService.updateUser(input);

      expect(redisSetMock).toHaveBeenCalledWith(
        `publicProfile:${userId}`,
        JSON.stringify({
          name: updatedInput.name,
          email: existingUser.email,
          profileIcon: updatedInput.profileIcon,
        }),
      );

      expect(result).toEqual({
        name: updatedInput.name,
        email: existingUser.email,
        profileIcon: updatedInput.profileIcon,
      });
    });
  });
  describe('resetPassword', () => {
    const email = 'test@email.com';
    const newPassword = 'newPassword123';
    const hashedPassword = 'hashed-newPassword123';
    const now = new Date();

    it('유저가 존재하지 않으면 예외를 던져야 합니다', async () => {
      const { userService } = await setupUserServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(null),
        },
      });
      const input: ResetPasswordInput = {
        email: email,
        newPassword: newPassword,
      };
      await expect(userService.resetPassword(input)).rejects.toThrow(UserNotFoundException);
    });

    it('입력된 비밀번호가 현재 비밀번호와 같으면 예외를 던져야 합니다', async () => {
      const user = {
        password: hashedPassword,
      };

      const { userService } = await setupUserServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(user),
        },
      });
      const input: ResetPasswordInput = {
        email: email,
        newPassword: newPassword,
      };
      await expect(userService.resetPassword(input)).rejects.toThrow(SamePasswordUsedException);
    });

    it('입력된 비밀번호가 과거에 사용된 비밀번호와 같으면 예외를 던져야 합니다', async () => {
      const user = {
        password: 'hashed-other',
        passwordHistory: [
          { password: hashedPassword, changedAt: new Date(now.getTime() - 7 * 86400_000) },
        ],
      };

      const { userService } = await setupUserServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(user),
        },
      });
      const input: ResetPasswordInput = {
        email: email,
        newPassword: newPassword,
      };
      await expect(userService.resetPassword(input)).rejects.toThrow(PasswordReusedException);
    });

    it('정상적인 요청이면 비밀번호를 해싱하고 저장해야 합니다', async () => {
      const persist = jest.fn();
      const user = {
        id: 1,
        email,
        password: 'hashed-old',
        passwordHistory: [],
      };

      const { userService } = await setupUserServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(user),
          getEntityManager: jest.fn().mockReturnValue({ persistAndFlush: persist }),
        },
      });
      const input: ResetPasswordInput = {
        email: email,
        newPassword: newPassword,
      };
      await userService.resetPassword(input);

      expect(user.password).toBe(hashedPassword);
      expect(user.passwordHistory?.length).toBe(1);
      expect(persist).toHaveBeenCalled();
    });
  });

  describe('calculateDateDifference', () => {
    const email = 'test@email.com';
    const password = 'new-password';

    const baseUser = {
      password: 'hashed-older',
      passwordHistory: [],
    };

    const makeOldDate = (days: number): Date => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const testCases = [
      { daysAgo: 65, expected: '2개월 전' },
      { daysAgo: 14, expected: '2주 전' },
      { daysAgo: 3, expected: '3일 전' },
      { daysAgo: 0, expected: '최근' },
    ];

    testCases.forEach(({ daysAgo, expected }) => {
      it(`${expected}에 사용된 비밀번호면 예외 메시지에 "${expected}"에 가 포함되어야 합니다`, async () => {
        const { userService } = await setupUserServiceTest({
          userRepo: {
            findOne: jest.fn().mockResolvedValue({
              ...baseUser,
              passwordHistory: [
                { password: 'hashed-new-password', changedAt: makeOldDate(daysAgo) },
              ],
            }),
          },
        });
        const input: ResetPasswordInput = {
          email: email,
          newPassword: password,
        };
        await expect(userService.resetPassword(input)).rejects.toThrow(
          new PasswordReusedException(expected),
        );
      });
    });
  });
  describe('addLocalAccount', () => {
    const userId = 101;
    const username = 'localuser';
    const email = 'local@email.com';
    const password = 'securePassword123';

    it('유저가 존재하지 않으면 예외를 던져야 합니다', async () => {
      const { userService } = await setupUserServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(null),
        },
      });
      const input: AddLocalAccountInput = {
        id: userId,
        username: username,
        email: email,
        password: password,
      };
      await expect(userService.addLocalAccount(input)).rejects.toThrow(UserNotFoundException);
    });

    it('이미 local 계정이 존재하면 예외를 던져야 합니다', async () => {
      const user = { id: userId };

      const { userService } = await setupUserServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(user),
        },
        socialRepo: {
          findOne: jest.fn().mockResolvedValue({}),
        },
      });
      const input: AddLocalAccountInput = {
        id: userId,
        username: username,
        email: email,
        password: password,
      };
      await expect(userService.addLocalAccount(input)).rejects.toThrow(
        AlreadyHasLocalAccountException,
      );
    });

    it('정상 요청이면 유저 정보를 갱신하고 local 계정을 생성해야 합니다', async () => {
      const persist = jest.fn();
      const user: Partial<User> = { id: userId };

      const { userService, socialAccountRepository } = await setupUserServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(user),
          getEntityManager: jest.fn().mockReturnValue({ persistAndFlush: persist }),
        },
        socialRepo: {
          findOne: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockReturnValue({}),
          getEntityManager: jest.fn().mockReturnValue({ persistAndFlush: persist }),
        },
      });
      const input: AddLocalAccountInput = {
        id: userId,
        username: username,
        email: email,
        password: password,
      };
      await userService.addLocalAccount(input);

      expect(user.username).toBe(username);
      expect(user.email).toBe(email);
      expect(user.password).toBe(`hashed-${password}`);
      expect(socialAccountRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          provider: 'local',
          providerId: username,
        }),
      );
      expect(persist).toHaveBeenCalledTimes(2);
    });
  });
  describe('createSocialUser', () => {
    const input = {
      provider: 'google' as const,
      providerId: 'google-id',
      email: 'user@social.com',
      name: '소셜 유저',
      profileIcon: 'icon.png',
      socialRefreshToken: 'refresh-token',
    };

    it('유저와 소셜 계정을 생성하고 페이로드를 반환해야 합니다', async () => {
      const persist = jest.fn();
      const user = {
        id: 1,
        email: input.email,
        role: 'user' as const,
      };

      const { userService, userRepository, socialAccountRepository } = await setupUserServiceTest({
        userRepo: {
          create: jest.fn().mockReturnValue(user),
          getEntityManager: jest.fn().mockReturnValue({ persistAndFlush: persist }),
        },
        socialRepo: {
          create: jest.fn(),
          getEntityManager: jest.fn().mockReturnValue({ persistAndFlush: persist }),
        },
      });

      const result = await userService.createSocialUser(input);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: input.email,
          name: input.name,
          profileIcon: input.profileIcon,
        }),
      );

      expect(socialAccountRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: input.provider,
          providerId: input.providerId,
          socialRefreshToken: input.socialRefreshToken,
        }),
      );

      expect(persist).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    });
    it('profileIcon이 주어지지 않으면 기본값으로 설정되어야 합니다', async () => {
      const input = {
        provider: 'google',
        providerId: 'google-id',
        email: 'social@email.com',
        name: '소셜유저',
        socialRefreshToken: 'refresh-token',
      } as CreateSocialUserInput;

      const { userService, userRepository } = await setupUserServiceTest({
        userRepo: {
          create: jest.fn().mockImplementation((data) => ({
            ...data,
            id: 1 as const,
            role: 'user' as const,
            email: (data as { email: string }).email,
          })),
          getEntityManager: jest.fn().mockReturnValue({ persistAndFlush: jest.fn() }),
        },
        socialRepo: {
          create: jest.fn(),
          getEntityManager: jest.fn().mockReturnValue({ persistAndFlush: jest.fn() }),
        },
      });

      const result = await userService.createSocialUser(input);
      expect(result.email).toBe(input.email);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          profileIcon: expect.stringContaining(
            'https://static.vecteezy.com/system/resources/thumbnails/002/318/271/small/user-profile-icon-free-vector.jpg',
          ) as string,
        }),
      );
    });
  });
  describe('deleteUser', () => {
    const userId = 100;
    const accessToken = 'access-token';
    const refreshToken = 'refresh-token';

    it('테스트 계정이면 예외를 던져야 합니다', async () => {
      const { userService } = await setupUserServiceTest({});
      const input: DeleteUserInput = {
        id: 123456789,
        accessToken: accessToken,
        refreshToken: refreshToken,
      };
      await expect(userService.deleteUser(input)).rejects.toThrow(TestAccountMutationException);
    });

    it('refreshToken을 검증 후 Redis에서 삭제해야 합니다', async () => {
      const decoded = { id: userId, rememberMe: true };

      const { userService, tokenService } = await setupUserServiceTest({
        tokenService: {
          verifyRefreshToken: jest.fn().mockResolvedValue(decoded),
          deleteRefreshTokenFromRedis: jest.fn(),
        },
        userRepo: {
          findOne: jest.fn().mockResolvedValue(null),
        },
      });
      const input: DeleteUserInput = {
        id: userId,
        accessToken: undefined,
        refreshToken: refreshToken,
      };
      await userService.deleteUser(input);

      expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(tokenService.deleteRefreshTokenFromRedis).toHaveBeenCalledWith(decoded.id);
    });

    it('accessToken이 주어지면 invalidateAccessToken을 호출해야 합니다', async () => {
      const { userService, tokenService } = await setupUserServiceTest({
        tokenService: {
          invalidateAccessToken: jest.fn(),
        },
        userRepo: {
          findOne: jest.fn().mockResolvedValue(null),
        },
      });
      const input: DeleteUserInput = {
        id: userId,
        accessToken: accessToken,
        refreshToken: undefined,
      };
      await userService.deleteUser(input);

      expect(tokenService.invalidateAccessToken).toHaveBeenCalledWith(accessToken);
    });

    it('유저가 존재하지 않으면 삭제를 생략해야 합니다', async () => {
      const { userService } = await setupUserServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(null),
          getEntityManager: jest.fn().mockReturnValue({ removeAndFlush: jest.fn() }),
        },
      });
      const input: DeleteUserInput = {
        id: userId,
        accessToken: undefined,
        refreshToken: undefined,
      };
      await userService.deleteUser(input);

      expect(jest.fn()).not.toHaveBeenCalled();
    });

    it('유저가 존재하면 removeAndFlush를 호출해야 합니다', async () => {
      const remove = jest.fn();

      const user = { id: userId };

      const { userService } = await setupUserServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(user),
          getEntityManager: jest.fn().mockReturnValue({ removeAndFlush: remove }),
        },
      });

      const input: DeleteUserInput = {
        id: userId,
        accessToken: undefined,
        refreshToken: undefined,
      };
      await userService.deleteUser(input);
      expect(remove).toHaveBeenCalledWith(user);
    });
  });
});
