import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';

import { TokenService } from '@/auth/services/token.service';
import { AccessTokenPayload, CreateUserInput, LoginUserInput, TokenPair } from '@/types/user.types';
import { User, UserDocument } from '@/user/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly tokenService: TokenService,
    private readonly config: ConfigService,
  ) {}

  async registerUser(input: CreateUserInput): Promise<void> {
    const { username, email, password, name, marketingConsent } = input;

    const existingUser = await this.userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new this.userModel({
      username,
      email,
      password: hashedPassword,
      name,
      marketingConsent,
      socialAccounts: [
        {
          provider: 'local',
          providerId: username,
        },
      ],
      termsAgreed: true,
    });

    await user.save();
  }

  /*  async loginUser(input: LoginUserInput): Promise<TokenPair> {
    const { username, password, rememberMe } = input;

    const user = await this.userModel.findOne({ username });

    const isPasswordValid = user?.password ? await bcrypt.compare(password, user.password) : false;
    if (!user || !isPasswordValid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    return this.tokenService.generateTokens(
      { _id: user._id.toString(), email: user.email, role: user.role },
      rememberMe,
      null,
    );
  }*/
  async loginUser(input: LoginUserInput): Promise<TokenPair> {
    const { username, password, rememberMe } = input;

    const user = await this.userModel.findOne({ username });
    const isPasswordValid = user?.password ? await bcrypt.compare(password, user.password) : false;

    if (!user || !isPasswordValid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const payload: AccessTokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const ttl = rememberMe
      ? this.config.getOrThrow<number>('auth.rememberRefreshTokenTtl')
      : this.config.getOrThrow<number>('auth.refreshTokenTtl');

    return this.tokenService.generateTokens(payload, ttl);
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const { id, rememberMe } = await this.tokenService.verifyRefreshToken(refreshToken);

    const user = await this.userModel.findById(id);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const key = `refreshToken:${id}`;
    const currentTtl = await this.tokenService.getRemainingTtl(key);

    const threshold = rememberMe
      ? this.config.getOrThrow<number>('auth.rememberRefreshTokenRenewThreshold')
      : this.config.getOrThrow<number>('auth.refreshTokenRenewThreshold');

    const maxTtl = rememberMe
      ? this.config.getOrThrow<number>('auth.rememberRefreshTokenTtl')
      : this.config.getOrThrow<number>('auth.refreshTokenTtl');

    const ttlToUse = currentTtl < threshold ? maxTtl : currentTtl;

    const payload: AccessTokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return this.tokenService.generateTokens(payload, ttlToUse);
  }

  /*
  async getUserById(userId: string): Promise<AccessTokenPayload> {
    const user = (await this.userModel
      .findById(userId)
      .select('-password')) as unknown as AccessTokenPayload;

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
*/
  async getUserById(userId: string): Promise<AccessTokenPayload> {
    const user = await this.userModel.findById(userId).select('email role');
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
  }
}
