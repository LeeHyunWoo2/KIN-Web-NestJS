import User from '../../models/user';
import Note from '../../models/note';
import Category from '../../models/category';
import Tag from '../../models/tag';
// @ts-ignore
import bcrypt from 'bcryptjs';
import { generateOAuthToken } from '../auth/tokenService';
import { revokeSocialAccess } from './socialService'; // 연동 해제를 위한 서비스 호출
import {redisClient} from '@/config/redis';
import {
  FindUserQuery,
  FindUserQueryData, PasswordHistoryTypes,
  PublicUserProfile,
  SafeUserInfo, SocialAccountTypes,
  UpdateUserProfileData
} from "@/types/User";
import {createHttpError} from "@/utils/createHttpError";

// 공개 프로필 데이터 조회
export const getUserPublicProfile = async (
    userId: string
): Promise<PublicUserProfile> => {
  try {
    // 우선 Redis에서 조회
    const cachedProfile = await redisClient.get(`publicProfile:${userId}`);
    if (cachedProfile) {
      return JSON.parse(cachedProfile);
    }

    // Redis에 없을 경우 DB에서 조회
    const user = await User.findById(userId).select('name email profileIcon role');
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    const publicProfile : PublicUserProfile = {
      name: user.name,
      email: user.email,
      profileIcon: user.profileIcon,
      userId: userId,
      role: user.role,
    };

    // Redis에 프로필 정보 저장
    await redisClient.set(
        `publicProfile:${userId}`,
        JSON.stringify(publicProfile),
        'EX',
        3600
    );

    return publicProfile;
  } catch {
    throw createHttpError(400, "프로필 정보 처리 중 오류")
  }
};

// 사용자 정보 조회 (로그인된 유저의 DB ObjectId와 비밀번호 관련 제외 모든 정보)
export const getUserById = async (
    userId: string
): Promise<SafeUserInfo> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error;
  }
  return user;
};

// 이메일 중복확인 및 아이디 비번 찾기
export const getUserByQuery = async (
    query: FindUserQuery
): Promise<FindUserQueryData> => {
  const {input, inputType} = query;
  let user;

  if (inputType === 'email') {
    user = await User.findOne({email: input});
  } else if (inputType === 'username') {
    user = await User.findOne({username: input});
  } else {
    throw new Error;
  }
  if (!user) {
    throw new Error;
  }
  return user as FindUserQueryData;
}

// 사용자 정보 수정
export const updateUser = async (
    userId: string,
    updateData: UpdateUserProfileData
): Promise<Partial<PublicUserProfile>> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw createHttpError(400, "유저를 찾을 수 없습니다.")
    }
    // 변경사항이 있는 항목은 db에 업데이트
    if (updateData.name) {
      user.name = updateData.name;
    }
    if (updateData.profileIcon) {
      user.profileIcon = updateData.profileIcon;
    }
    await user.save();

    const redisKey = `publicProfile:${userId}`;
    const ttl = await redisClient.ttl(redisKey);

    const cachedProfile = await redisClient.get(redisKey);
    let updatedProfile: Partial<PublicUserProfile>;

    if (cachedProfile) {
      const parsedProfile = JSON.parse(cachedProfile);
      updatedProfile = {
        ...parsedProfile,
        name: updateData.name || parsedProfile.name,
        profileIcon: updateData.profileIcon || parsedProfile.profileIcon,
      };
    } else {
      updatedProfile = {
        name: user.name,
        email: user.email,
        profileIcon: user.profileIcon,
      };
    }

    await redisClient.set(redisKey, JSON.stringify(updatedProfile));
    if (ttl > 0) {
      await redisClient.expire(redisKey, ttl);
    }

    return updatedProfile;
  } catch (error) {
    throw error;
  }
};

// ~일전 날짜 포맷팅 함수
const calculateDateDifference = (pastDate: Date): string => {
  const now = new Date();
  const diffInMs = now.getDate() - pastDate.getTime();

  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInDays / (7));
  const diffInMonths = Math.floor(diffInWeeks / 4);

  if (diffInMonths > 0) {
    return diffInMonths + '개월 전';
  } else if (diffInWeeks > 0) {
    return diffInWeeks + '주 전';
  } else if (diffInDays > 0) {
    return diffInDays + '일 전'
  } else {
    return '최근';
  }
};

// 비밀번호 변경 (비밀번호 찾기)
export const resetPassword = async (
    newPassword: string,
    email: string,
): Promise<void> => {

    const user = await User.findOne({email});
    if (!user) {
      throw createHttpError(404, "유저를 찾을 수 없습니다.")
    }

    const isCurrentPassword = await bcrypt.compare(newPassword, user.password);
    if (isCurrentPassword) {
      throw createHttpError(400, "현재 사용 중인 비밀번호와 다른 비밀번호를 입력해주세요.")
    }

    const duplicateRecord = (user.passwordHistory as PasswordHistoryTypes[])
    .find((record: PasswordHistoryTypes) =>
        bcrypt.compareSync(newPassword, record.password)
    );
    if (duplicateRecord) {
      const timeDifference = calculateDateDifference(duplicateRecord.changedAt);
      throw createHttpError(400, `${timeDifference}에 사용된 비밀번호입니다.`)
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // 비밀번호 기록에 추가 (최대 5개 기록 유지)
    if (user.passwordHistory.length >= 5) {
      user.passwordHistory.shift(); // 가장 오래된 기록 제거
    }
    user.passwordHistory.push(
        {password: hashedPassword, changedAt: new Date()});

    // 비밀번호 저장
    await user.save();
};

// 로컬 계정 추가 (소셜 Only 계정용)
export const addLocalAccount = async (
    userId: string,
    username: string,
    email: string,
    password: string,
): Promise<void> => {

  const user = await User.findById(userId);

  if (!user) {
    throw new Error;
  }

  if (user.socialAccounts.some((account: SocialAccountTypes) => account.provider === 'local')) {
    throw createHttpError(400, "이미 로컬 계정이 등록되어 있습니다.")
  }

  user.id = username ;
  user.email = email;
  user.password = await bcrypt.hash(password, 10);
  user.socialAccounts.push({provider: 'local', providerId: user});
  await user.save();
};

export const deleteUserById = async (
    userId: string,
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error;
  }

  for (const account of user.socialAccounts) {
    if (account.provider !== 'local') {
      const accessToken = await generateOAuthToken(user,
          account.provider);
      await revokeSocialAccess(account.provider, accessToken);
    }
  }

  await Tag.deleteMany({user_id: userId});
  await Category.deleteMany({user_id: userId});
  await Note.deleteMany({user_id: userId});
  await User.findByIdAndDelete(userId);
};