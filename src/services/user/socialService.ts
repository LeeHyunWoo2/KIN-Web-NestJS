import User from '../../models/user';
import axios from 'axios';
import { generateOAuthToken } from '../auth/tokenService';

// 소셜 연동 해제
export const unlinkAccount = async (userId, provider) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }

    // '소셜 only 계정' 의 마지막 소셜 연동 해제 방지 (로컬도, 소셜도 아닌 계정이 생기는 것을 방지)
    const socialAccounts = user.socialAccounts.filter(acc => acc.provider !== provider);

    const oauthToken = await generateOAuthToken(user, provider);

    await revokeSocialAccess(provider, oauthToken);
    user.socialAccounts = socialAccounts;

    await user.save();

    return user;
  } catch (error) {
    throw error;
  }
};


// 플랫폼에게 연동 해제 요청
export const revokeSocialAccess = async (provider, token) => {
  try {
    if (provider === 'google') {
      await axios.post(`https://oauth2.googleapis.com/revoke?token=${token}`);
    } else if (provider === 'kakao') {
      await axios.post('https://kapi.kakao.com/v1/user/unlink', null, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } else if (provider === 'naver') {
      await axios.post('https://nid.naver.com/oauth2.0/token', null, {
        params: {
          grant_type: 'delete',
          client_id: process.env.NAVER_CLIENT_ID,
          client_secret: process.env.NAVER_CLIENT_SECRET,
          access_token: token
        }
      });
    }
  } catch (error) {
    throw error;
  }
};