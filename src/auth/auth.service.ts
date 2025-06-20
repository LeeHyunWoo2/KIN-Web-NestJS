import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

import { TokenService } from '@/auth/token.service';
import {
  AccessTokenPayload,
  CreateUserInput,
  LoginUserInput,
  TokenPair,
} from '@/auth/types/auth-service.types';
import { LogExecutionTime } from '@/common/decorators/log-execution-time.decorator';
import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  RefreshTokenMissingException,
  UsernameAlreadyExistsException,
  UserNotFoundException,
} from '@/common/exceptions';
import { SocialAccount } from '@/user/entity/social-account.entity';
import { User } from '@/user/entity/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @InjectRepository(SocialAccount)
    private readonly socialAccountRepository: EntityRepository<SocialAccount>,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
  ) {}

  @LogExecutionTime()
  async registerUser(input: CreateUserInput): Promise<void> {
    const { username, email, password, name, marketingConsent } = input;

    const existingUser = await this.userRepository.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new UsernameAlreadyExistsException();
      }
      if (existingUser.email === email) {
        throw new EmailAlreadyExistsException();
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      name,
      marketingConsent: marketingConsent ?? false,
      role: 'user',
      profileIcon:
        'https://static.vecteezy.com/system/resources/thumbnails/002/318/271/small/user-profile-icon-free-vector.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
      passwordHistory: [],
    });

    await this.userRepository.getEntityManager().persistAndFlush(user);

    const socialAccount = this.socialAccountRepository.create({
      user,
      provider: 'local',
      providerId: username,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await this.socialAccountRepository.getEntityManager().persistAndFlush(socialAccount);
  }

  @LogExecutionTime()
  async loginUser(input: LoginUserInput): Promise<TokenPair> {
    const { username, password, rememberMe } = input;

    const user = await this.userRepository.findOne(
      { username },
      { fields: ['id', 'email', 'password', 'role'] },
    );

    const isPasswordValid = user?.password ? await bcrypt.compare(password, user.password) : false;

    if (!user || !isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    const payload: AccessTokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const ttl = rememberMe
      ? this.configService.getOrThrow<number>('auth.rememberRefreshTokenTtl')
      : this.configService.getOrThrow<number>('auth.refreshTokenTtl');

    return this.tokenService.generateTokens(payload, ttl);
  }

  @LogExecutionTime()
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    if (!refreshToken) {
      throw new RefreshTokenMissingException();
    }
    const { id, rememberMe } = await this.tokenService.verifyRefreshToken(refreshToken);

    const user = await this.userRepository.findOne(id, {
      fields: ['id', 'email', 'role'],
    });

    if (!user) throw new UserNotFoundException();

    const key = `refreshToken:${id}`;
    const currentTtl = await this.tokenService.getRemainingTtl(key);

    const threshold = rememberMe
      ? this.configService.getOrThrow<number>('auth.rememberRefreshTokenRenewThreshold')
      : this.configService.getOrThrow<number>('auth.refreshTokenRenewThreshold');

    const maxTtl = rememberMe
      ? this.configService.getOrThrow<number>('auth.rememberRefreshTokenTtl')
      : this.configService.getOrThrow<number>('auth.refreshTokenTtl');

    const ttlToUse = currentTtl < threshold ? maxTtl : currentTtl;

    const payload: AccessTokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    return this.tokenService.generateTokens(payload, ttlToUse);
  }
}
