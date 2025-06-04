import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyReply, FastifyRequest } from 'fastify';

import { AccessGuard } from '@/auth/access.guard';
import { TokenService } from '@/auth/token.service';
import { DecodedUser } from '@/auth/types/auth-service.types';
import { ResetPasswordDto } from '@/user/dto/user-auth.dto';
import {
  AddLocalAccountDto,
  PublicUserProfileDto,
  UpdateUserDto,
  UserInfoResponseDto,
} from '@/user/dto/user-profile.dto';
import { FindUserDto, FindUserResultDto } from '@/user/dto/user-search.dto';
import {
  AddLocalAccountInput,
  DeleteUserInput,
  ResetPasswordInput,
  UpdateUserInput,
  UserInfoResult,
} from '@/user/types/user-service.types';
import { UserController } from '@/user/user.controller';
import { UserService } from '@/user/user.service';

import { createMockConfigService, MockConfigType } from '../../test/utils/config.mock';

interface SetupOptions {
  userService?: Partial<UserService>;
  config?: MockConfigType;
}

const setupUserControllerTest = async (
  overrides: SetupOptions = {},
): Promise<{
  controller: UserController;
  userService: jest.Mocked<UserService>;
  config: ConfigService;
}> => {
  const userService = {
    getPublicProfile: jest.fn(),
    getUserInfo: jest.fn(),
    updateUser: jest.fn(),
    resetPassword: jest.fn(),
    findUserByInput: jest.fn(),
    addLocalAccount: jest.fn(),
    deleteUser: jest.fn(),
    ...overrides.userService,
  } as unknown as jest.Mocked<UserService>;

  const defaultConfig = {
    'app.nodeEnv': 'test',
  };

  const config = createMockConfigService({
    ...defaultConfig,
    ...(overrides.config || {}),
  });

  const moduleRef: TestingModule = await Test.createTestingModule({
    controllers: [UserController],
    providers: [
      { provide: UserService, useValue: userService },
      { provide: AccessGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
      { provide: TokenService, useValue: {} },
      { provide: ConfigService, useValue: config },
    ],
  }).compile();

  return {
    controller: moduleRef.get(UserController),
    userService,
    config: moduleRef.get(ConfigService),
  };
};

describe('UserController', () => {
  describe('getPublicUserProfile', () => {
    it('PublicUserProfileDto를 반환해야 합니다', async () => {
      const user: DecodedUser = { id: 1, email: 'test@test.com', role: 'user' };
      const expected: PublicUserProfileDto = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
        profileIcon: 'icon.png',
        role: 'user',
      };

      const { controller, userService } = await setupUserControllerTest();

      userService.getPublicProfile.mockResolvedValue(expected);

      const result = await controller.getPublicUserProfile(user);
      expect(result).toEqual(expected);
    });
  });

  describe('getUserInfo', () => {
    it('UserInfoResponseDto를 반환해야 합니다', async () => {
      const user: DecodedUser = { id: 1, email: 'test@test.com', role: 'user' };
      const expected: UserInfoResult = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        email: 'test@test.com',
        profileIcon: 'icon.png',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        marketingConsent: true,
        lastActivity: new Date(),
        socialAccounts: [],
      };

      const { controller, userService } = await setupUserControllerTest();

      userService.getUserInfo.mockResolvedValue(expected);

      const result: UserInfoResponseDto = await controller.getUserInfo(user);
      expect(result).toEqual(expected);
    });
  });

  describe('updateUser', () => {
    it('Partial<PublicUserProfileDto>를 반환해야 합니다', async () => {
      const user: DecodedUser = { id: 1, email: 'test@test.com', role: 'user' };
      const updatedData: UpdateUserDto = { name: 'New Name', profileIcon: 'new-icon.png' };
      const expected: Partial<PublicUserProfileDto> = {
        name: 'New Name',
        profileIcon: 'new-icon.png',
      };

      const input: UpdateUserInput = { id: user.id, data: updatedData };

      const { controller, userService } = await setupUserControllerTest();

      userService.updateUser.mockResolvedValue(expected);

      const result = await controller.updateUser(user, updatedData);
      expect(userService.updateUser).toHaveBeenCalledWith(input);
      expect(result).toEqual(expected);
    });
  });

  describe('resetPassword', () => {
    it('ResetPasswordInput으로 호출해야 합니다', async () => {
      const dto: ResetPasswordDto = { email: 'test@test.com', newPassword: 'Password1!' };
      const input: ResetPasswordInput = { email: dto.email, newPassword: dto.newPassword };

      const { controller, userService } = await setupUserControllerTest();

      await controller.resetPassword(dto);

      expect(userService.resetPassword).toHaveBeenCalledWith(input);
    });
  });

  describe('findUserByInput', () => {
    it('FindUserResultDto를 반환해야 합니다', async () => {
      const dto: FindUserDto = { input: 'testuser', inputType: 'username', fetchUsername: true };
      const expected: FindUserResultDto = {
        signal: 'user_found',
        accountType: 'Local',
        username: 'testuser',
        email: 'test@test.com',
      };

      const { controller, userService } = await setupUserControllerTest();

      userService.findUserByInput.mockResolvedValue(expected);

      const result = await controller.findUserByInput(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('addLocalAccount', () => {
    it('AddLocalAccountInput으로 호출해야 합니다', async () => {
      const user: DecodedUser = { id: 1, email: 'test@test.com', role: 'user' };
      const dto: AddLocalAccountDto = {
        username: 'testuser',
        email: 'test@test.com',
        password: 'Password1!',
      };
      const input: AddLocalAccountInput = {
        id: user.id,
        username: dto.username,
        email: dto.email,
        password: dto.password,
      };

      const { controller, userService } = await setupUserControllerTest();

      await controller.addLocalAccount(user, dto);

      expect(userService.addLocalAccount).toHaveBeenCalledWith(input);
    });
  });

  describe('deleteUser', () => {
    it('DeleteUserInput으로 호출하고 쿠키를 삭제해야 합니다', async () => {
      const user: DecodedUser = { id: 1, email: 'test@test.com', role: 'user' };
      const refreshToken = 'refresh-token';
      const accessToken = 'access-token';
      const req = { cookies: { accessToken } } as unknown as FastifyRequest;
      const reply = { clearCookie: jest.fn() } as unknown as FastifyReply;

      const input: DeleteUserInput = { id: user.id, accessToken, refreshToken };

      const { controller, userService } = await setupUserControllerTest();

      await controller.deleteUser(user, req, refreshToken, reply);

      expect(userService.deleteUser).toHaveBeenCalledWith(input);
      expect(reply.clearCookie).toHaveBeenCalledWith('accessToken');
      expect(reply.clearCookie).toHaveBeenCalledWith('refreshToken');
    });
  });
});
