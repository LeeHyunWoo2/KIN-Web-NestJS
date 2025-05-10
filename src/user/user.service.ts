import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Redis } from 'ioredis';
import { assoc, mergeRight, pick, prop } from 'ramda';

import { TokenService } from '@/auth/token.service';
import { AccessTokenPayload } from '@/auth/types/auth-service.types';
import { LogExecutionTime } from '@/common/decorators/log-execution-time.decorator';
import {
  AlreadyHasLocalAccountException,
  PasswordReusedException,
  SamePasswordUsedException,
  TestAccountMutationException,
  UserNotFoundException,
} from '@/common/exceptions';
import { REDIS_CLIENT } from '@/config/redis.provider.config';
import {
  AddLocalAccountInput,
  CreateSocialUserInput,
  DeleteUserInput,
  FindUserQuery,
  FindUserQueryData,
  PublicUserProfile,
  ResetPasswordInput,
  UpdateUserInput,
  UserInfoResult,
} from '@/user/types/user-service.types';

import { SocialAccount } from './entity/social-account.entity';
import { User } from './entity/user.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @InjectRepository(SocialAccount)
    private readonly socialAccountRepository: EntityRepository<SocialAccount>,
    private readonly tokenService: TokenService,
  ) {}

  @LogExecutionTime()
  async getPublicProfile(id: number): Promise<PublicUserProfile> {
    const cacheKey = `publicProfile:${id}`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached) as PublicUserProfile;

    const user = await this.userRepository.findOne(id, {
      fields: ['name', 'email', 'profileIcon', 'id', 'role'],
    });
    if (!user) throw new UserNotFoundException();

    const profile: PublicUserProfile = {
      name: user.name,
      email: user.email,
      profileIcon: user.profileIcon,
      id: user.id,
      role: user.role,
    };

    await this.redisClient.set(cacheKey, JSON.stringify(profile), 'EX', 3600);
    return profile;
  }

  @LogExecutionTime()
  async getUserInfo(id: number): Promise<UserInfoResult> {
    const user = await this.userRepository.findOne(id, {
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
    if (!user) throw new UserNotFoundException();
    return {
      username: user.username ?? undefined,
      name: user.name,
      email: user.email,
      profileIcon: user.profileIcon,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  @LogExecutionTime()
  async findUserByInput(
    query: FindUserQuery & { fetchUsername: boolean },
  ): Promise<FindUserQueryData> {
    const { input, inputType, fetchUsername } = query;

    const user = await this.userRepository.findOne(
      { [inputType]: input },
      { fields: ['id', 'username', 'email'] },
    );

    if (!user) return { signal: 'user_not_found' };

    const hasLocalAccount = await this.socialAccountRepository.findOne({
      user,
      provider: 'local',
    });

    const accountType = hasLocalAccount ? 'Local' : 'SNS';

    const base: FindUserQueryData = {
      signal: 'user_found',
      accountType,
    };

    const additionalField = fetchUsername
      ? assoc('username', prop('username', user), {})
      : assoc('email', prop('email', user), {});

    return { ...base, ...additionalField };
  }

  async findUserBySocialAccount(
    provider: 'google' | 'kakao' | 'naver',
    providerId: string,
  ): Promise<AccessTokenPayload | null> {
    const account = await this.socialAccountRepository.findOne(
      {
        provider,
        providerId,
      },
      {
        populate: ['user'],
      },
    );
    if (!account || !account.user) return null;

    return {
      id: account.user.id,
      email: account.user.email,
      role: account.user.role,
    };
  }

  @LogExecutionTime()
  async updateUser(input: UpdateUserInput): Promise<Partial<PublicUserProfile>> {
    const { id, data } = input;
    this.ensureNotTestAccount(id);

    const user = await this.userRepository.findOne(id, {
      fields: ['id', 'name', 'email', 'profileIcon'],
    });

    if (!user) throw new UserNotFoundException();

    if (data.name) user.name = data.name;
    if (data.profileIcon) user.profileIcon = data.profileIcon;

    await this.userRepository.getEntityManager().persistAndFlush(user);

    const cacheKey = `publicProfile:${id}`;
    const cached = await this.redisClient.get(cacheKey);
    const ttl = await this.redisClient.ttl(cacheKey);

    const pickedData = pick(['name', 'profileIcon'], data);

    const updatedProfile = cached
      ? mergeRight(JSON.parse(cached) as PublicUserProfile, pickedData)
      : {
          name: user.name,
          email: user.email,
          profileIcon: user.profileIcon,
        };

    await this.redisClient.set(cacheKey, JSON.stringify(updatedProfile));
    if (ttl > 0) await this.redisClient.expire(cacheKey, ttl);
    return updatedProfile;
  }

  @LogExecutionTime()
  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const { email, newPassword } = input;
    const user = await this.userRepository.findOne(
      { email },
      { fields: ['id', 'email', 'password', 'passwordHistory'] },
    );

    if (!user) throw new UserNotFoundException();

    const isSamePassword = await bcrypt.compare(newPassword, <string>user.password);
    if (isSamePassword) throw new SamePasswordUsedException();

    const reusedPassword = user.passwordHistory.find((record) =>
      bcrypt.compareSync(newPassword, record.password),
    );

    if (reusedPassword) {
      const timeDifference = this.calculateDateDifference(reusedPassword.changedAt);
      throw new PasswordReusedException(timeDifference);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordHistory = user.passwordHistory
      .slice(-4)
      .concat({ password: hashedPassword, changedAt: new Date() });

    await this.userRepository.getEntityManager().persistAndFlush(user);
  }

  async addLocalAccount(input: AddLocalAccountInput): Promise<void> {
    const { id, username, email, password } = input;

    const user = await this.userRepository.findOne(id);
    if (!user) throw new UserNotFoundException();

    const hasLocalAccount = await this.socialAccountRepository.findOne({
      user,
      provider: 'local',
    });

    if (hasLocalAccount) {
      throw new AlreadyHasLocalAccountException();
    }

    user.username = username;
    user.email = email;
    user.password = await bcrypt.hash(password, 10);

    await this.userRepository.getEntityManager().persistAndFlush(user);

    const localAccount = this.socialAccountRepository.create({
      user,
      provider: 'local',
      providerId: username,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.socialAccountRepository.getEntityManager().persistAndFlush(localAccount);
  }

  async createSocialUser(input: CreateSocialUserInput): Promise<AccessTokenPayload> {
    const user = this.userRepository.create({
      email: input.email,
      name: input.name,
      role: 'user',
      profileIcon:
        input.profileIcon ??
        'https://static.vecteezy.com/system/resources/thumbnails/002/318/271/small/user-profile-icon-free-vector.jpg',
      marketingConsent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      passwordHistory: [],
    });

    await this.userRepository.getEntityManager().persistAndFlush(user);

    const socialAccount = this.socialAccountRepository.create({
      user,
      provider: input.provider,
      providerId: input.providerId,
      socialRefreshToken: input.socialRefreshToken,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.socialAccountRepository.getEntityManager().persistAndFlush(socialAccount);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async deleteUser(input: DeleteUserInput): Promise<void> {
    const { id, refreshToken, accessToken } = input;
    this.ensureNotTestAccount(id);

    if (refreshToken) {
      const decoded = await this.tokenService.verifyRefreshToken(refreshToken);
      await this.tokenService.deleteRefreshTokenFromRedis(decoded.id);
    }

    if (accessToken) {
      await this.tokenService.invalidateAccessToken(accessToken);
    }

    const user = await this.userRepository.findOne(id, {
      fields: ['id'],
    });

    if (user) {
      await this.userRepository.getEntityManager().removeAndFlush(user);
    }
  }

  private ensureNotTestAccount(id: number): void {
    const testAccounts = [123456789, 987654321];
    if (testAccounts.includes(id)) {
      throw new TestAccountMutationException();
    }
  }

  private calculateDateDifference(pastDate: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - pastDate.getTime();

    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInWeeks / 4);

    if (diffInMonths > 0) {
      return diffInMonths + '개월 전';
    } else if (diffInWeeks > 0) {
      return diffInWeeks + '주 전';
    } else if (diffInDays > 0) {
      return diffInDays + '일 전';
    } else {
      return '최근';
    }
  }
}
