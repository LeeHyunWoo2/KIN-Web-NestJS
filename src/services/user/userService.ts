import User from '../../models/user';
import Note from '../../models/note';
import Category from '../../models/category';
import Tag from '../../models/tag';
import bcrypt from 'bcryptjs';
import { generateOAuthToken } from '../auth/tokenService';
import { revokeSocialAccess } from './socialService'; // 연동 해제를 위한 서비스 호출
import redisClient from '../../config/redis';

// 공개 프로필 데이터 조회
const getUserPublicProfile = async (userId) => {
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

    const publicProfile = {
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
  } catch (error) {
    console.error('프로필 정보 처리 중 오류:', error.message);
    throw error;
  }
};

// 사용자 정보 조회 (로그인된 유저의 비밀번호 제외 모든 정보)
const getUserById = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new Error;
  }
  return user;
};

// 이메일 중복확인 및 아이디 비번 찾기
const getUserByInput = async (inputData) => {
  const {input, inputType} = inputData;
  let user;
  if (inputType === 'email') {
    user = await User.findOne({email: input});
  } else if (inputType === 'id') {
    user = await User.findOne({id: input});
  } else {
    throw new Error;
  }
  if (!user) {
    throw new Error;
  }
  return user;
}

// 사용자 정보 수정
const updateUser = async (userId, updateData) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error;
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
    let updatedProfile = {};

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
    console.error('사용자 정보 수정 중 오류:', error.message);
    throw error;
  }
};

// ~일전 날짜 포맷팅 함수
const calculateDateDifference = (pastDate) => {
  const now = new Date();
  const diffInMs = now - pastDate;

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
const resetPassword = async (newPassword, email) => {
  try {
    const user = await User.findOne({email});
    if (!user) {
      const error = new Error("유저를 찾을 수 없습니다.");
      error.status = 404;
      throw error;
    }

    const isCurrentPassword = await bcrypt.compare(newPassword, user.password);
    if (isCurrentPassword) {
      const error = new Error("현재 사용 중인 비밀번호와 다른 비밀번호를 입력해주세요.");
      error.status = 400;
      throw error;
    }

    const duplicateRecord = user.passwordHistory.find(record =>
        bcrypt.compareSync(newPassword, record.password)
    );
    if (duplicateRecord) {
      const timeDifference = calculateDateDifference(duplicateRecord.changedAt);
      const error = new Error(`${timeDifference}에 사용된 비밀번호입니다.`);
      error.status = 400;
      throw error;
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
  } catch (error) {
    console.error(error.message);
    throw error;
  }
};

// 로컬 계정 추가 (소셜 Only 계정용)
const addLocalAccount = async (userId, id, email, password) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error;
  }
  if (user.socialAccounts.some(account => account.provider === 'local')) {
    const error = new Error("이미 로컬 계정이 등록되어 있습니다.");
    error.status = 400;
    throw error;
  }

  user.id = id;
  user.email = email;
  user.password = await bcrypt.hash(password, 10);
  user.socialAccounts.push({provider: 'local', providerId: id});
  await user.save();
};

const deleteUserById = async (userId) => {
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

module.exports = {
  getUserPublicProfile,
  getUserById,
  getUserByInput,
  updateUser,
  resetPassword,
  addLocalAccount,
  deleteUserById,
};