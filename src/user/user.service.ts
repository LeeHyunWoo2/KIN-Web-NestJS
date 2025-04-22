import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Redis } from 'ioredis';
import { Model } from 'mongoose';

import { TokenService } from '@/auth/services/token/token.service';
import { CatchAndLog } from '@/common/decorators/catch-and-log.decorator';
import { LogExecutionTime } from '@/common/decorators/log-execution-time.decorator';
import { REDIS_CLIENT } from '@/config/redis.provider.config';
import {
  AccessTokenPayload,
  FindUserQuery,
  FindUserQueryData,
  PublicUserProfile,
  SafeUserInfo,
  UpdateUserProfileData,
} from '@/types/user.types';

import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    private readonly tokenService: TokenService,
  ) {}

  @CatchAndLog()
  @LogExecutionTime()
  async getPublicProfile(userId: string): Promise<PublicUserProfile> {
    const cacheKey = `publicProfile:${userId}`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached) as PublicUserProfile;

    const user = await this.userModel.findById(userId).select('name email profileIcon role');
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const profile: PublicUserProfile = {
      name: user.name,
      email: user.email,
      profileIcon: user.profileIcon,
      userId,
      role: user.role,
    };

    await this.redisClient.set(cacheKey, JSON.stringify(profile), 'EX', 3600);
    return profile;
  }

  @CatchAndLog()
  async getUserInfo(userId: string): Promise<SafeUserInfo> {
    const user = await this.userModel
      .findById(userId)
      .select('-password, -passwordHistory, -deleteQueue');
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    return user.toObject();
  }

  @CatchAndLog()
  async findUserByInput(
    query: FindUserQuery & { fetchUsername: boolean },
  ): Promise<FindUserQueryData> {
    const { input, inputType, fetchUsername } = query;

    const user = await this.userModel
      .findOne({ [inputType]: input })
      .select(fetchUsername ? 'username' : 'email' + 'socialAccounts');

    if (!user) {
      return { signal: 'user_not_found' };
    }

    const hasLocalAccount = user.socialAccounts.some((account) => account.provider === 'local');
    const accountType: 'Local' | 'SNS' = hasLocalAccount ? 'Local' : 'SNS';

    return {
      signal: 'user_found',
      accountType,
      ...(fetchUsername ? { username: user.username } : { email: user.email }),
    };
  }

  @CatchAndLog()
  async findUserBySocialAccount(
    provider: 'google' | 'kakao' | 'naver',
    providerId: string,
  ): Promise<AccessTokenPayload | null> {
    const user = await this.userModel.findOne({
      socialAccounts: {
        $elemMatch: { provider, providerId },
      },
    });

    if (!user) return null;

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
  }

  @CatchAndLog()
  async updateUser(
    userId: string,
    data: UpdateUserProfileData,
  ): Promise<Partial<PublicUserProfile>> {
    this.ensureNotTestAccount(userId);

    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (data.name) user.name = data.name;
    if (data.profileIcon) user.profileIcon = data.profileIcon;
    await user.save();

    const cacheKey = `publicProfile:${userId}`;
    const cached = await this.redisClient.get(cacheKey);
    const ttl = await this.redisClient.ttl(cacheKey);

    const updatedProfile = cached
      ? {
          ...(JSON.parse(cached) as PublicUserProfile),
          name: data.name || (JSON.parse(cached) as PublicUserProfile).name,
          profileIcon: data.profileIcon || (JSON.parse(cached) as PublicUserProfile).profileIcon,
        }
      : {
          name: user.name,
          email: user.email,
          profileIcon: user.profileIcon,
        };
    await this.redisClient.set(cacheKey, JSON.stringify(updatedProfile));
    if (ttl > 0) await this.redisClient.expire(cacheKey, ttl);
    return updatedProfile;
  }

  @CatchAndLog()
  async resetPassword(email: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const isSamePassword = await bcrypt.compare(newPassword, user.password || '');
    if (isSamePassword)
      throw new HttpException('현재 비밀번호와 다르게 설정해주세요.', HttpStatus.BAD_REQUEST);

    const reusedPassword = (user.passwordHistory || []).find((record) =>
      bcrypt.compareSync(newPassword, record.password),
    );
    if (reusedPassword) {
      const timeDifference = this.calculateDateDifference(reusedPassword.changedAt);
      throw new HttpException(`${timeDifference}에 사용된 비밀번호입니다.`, HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.passwordHistory = (user.passwordHistory || [])
      .slice(-4)
      .concat({ password: hashedPassword, changedAt: new Date() });

    await user.save();
  }

  @CatchAndLog()
  async addLocalAccount(
    userId: string,
    username: string,
    email: string,
    password: string,
  ): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const hasLocalAccount = user.socialAccounts.some((account) => account.provider === 'local');
    if (hasLocalAccount)
      throw new HttpException('이미 로컬 계정이 존재합니다.', HttpStatus.BAD_REQUEST);

    user.username = username;
    user.email = email;
    user.password = await bcrypt.hash(password, 10);
    user.socialAccounts = user.socialAccounts.concat({
      provider: 'local',
      providerId: username,
    });

    await user.save();
  }

  async createSocialUser(input: {
    provider: 'google' | 'kakao' | 'naver';
    providerId: string;
    email?: string;
    name: string;
    profileIcon?: string;
    socialRefreshToken?: string;
  }): Promise<AccessTokenPayload> {
    const user = new this.userModel({
      email: input.email,
      name: input.name,
      profileIcon: input.profileIcon,
      termsAgreed: true,
      socialAccounts: [
        {
          provider: input.provider,
          providerId: input.providerId,
          socialRefreshToken: input.socialRefreshToken,
        },
      ],
    });

    await user.save();

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
  }

  async deleteUser(userId: string, accessToken?: string, refreshToken?: string): Promise<void> {
    this.ensureNotTestAccount(userId);

    if (refreshToken) {
      const decoded = await this.tokenService.verifyRefreshToken(refreshToken);
      await this.tokenService.deleteRefreshTokenFromRedis(decoded.id);
    }

    if (accessToken) {
      await this.tokenService.invalidateAccessToken(accessToken);
    }

    await this.userModel.findByIdAndDelete(userId);
  }

  @CatchAndLog()
  private ensureNotTestAccount(userId: string): void {
    const testAccounts = ['672ae1ad9595d29f7bfbf34a', '672ae28b9595d29f7bfbf353'];
    if (testAccounts.includes(userId)) {
      throw new HttpException('테스트 계정은 변경할 수 없습니다.', HttpStatus.I_AM_A_TEAPOT);
    }
  }

  private calculateDateDifference(pastDate: Date): string {
    const now = new Date();
    const diffInMs = now.getDate() - pastDate.getTime();

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
