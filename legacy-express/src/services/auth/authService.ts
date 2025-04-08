
// @ts-ignore
import bcrypt from 'bcryptjs';
import User from '../../models/user';
import { generateTokens } from './tokenService';
import { createHttpError } from "@/utils/createHttpError";
import {
  RegisterRequestDto,
} from '@/types/dto/auth/auth.request.dto';
import {AccessTokenPayload, TokenPair} from '@/types/User';

// 회원가입 (로컬 계정)
export const registerUser = async (
    data: RegisterRequestDto
): Promise<void>  => {
  const { username, email, password, name, marketingConsent } = data;

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw createHttpError(400, "이미 사용 중인 이메일 혹은 ID입니다.");
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
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
  return;
};

export const loginUser = async (
    username: string,
    password: string,
    rememberMe: boolean
): Promise<TokenPair> => {
  const user = await User.findOne({ username });
  const isPasswordValid = user ? await bcrypt.compare(password, user.password) : false;

  if (!user || !isPasswordValid) {
    throw createHttpError(400, "ID 또는 비밀번호가 일치하지 않습니다.")
  }

  const tokens = await generateTokens(user, rememberMe, null);
  return tokens;
};

// 사용자 정보 조회 (토큰 갱신용)
export const getUserById = async (userId : string) : Promise<AccessTokenPayload> => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw createHttpError(400, "유저 정보를 찾을 수 없습니다.");
  }
  return user;
};