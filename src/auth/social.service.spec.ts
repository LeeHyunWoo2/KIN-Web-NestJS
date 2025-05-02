import { AlreadyLinkedException } from '@/common/exceptions/auth.exceptions';
import {
  NoRemainingAuthMethodException,
  UserNotFoundException,
} from '@/common/exceptions/user.exceptions';

import { setupSocialServiceTest } from '../../test/utils/social-service.test-helper';

jest.mock('@/config/global-config.service', () => ({
  getConfig: () => ({
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'auth.accessTokenTtl') return 3600;
      return undefined;
    }),
  }),
}));

describe('SocialService', () => {
  describe('handleSocialCallbackResult', () => {
    const reply = {
      redirect: jest.fn(),
    } as any;
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('user가 undefined이면 로그인 페이지로 리다이렉트 해야 합니다.', async () => {
      const { socialService, config } = await setupSocialServiceTest();

      await socialService.handleSocialCallbackResult(undefined, reply);

      expect(reply.redirect).toHaveBeenCalledWith(
        `${config.getOrThrow('app.frontendOrigin')}/login`,
      );
    });

    it('에러 코드가 11000이면 이미 가입된 이메일 에러 메시지로 리다이렉트 해야 합니다.', async () => {
      const { socialService, config } = await setupSocialServiceTest();

      const error = { code: 11000 };

      await socialService.handleSocialCallbackResult(
        { id: 1, email: 'test', role: 'user' },
        reply,
        error,
      );

      expect(reply.redirect).toHaveBeenCalledWith(
        `${config.getOrThrow('app.frontendOrigin')}/login?error=${encodeURIComponent(
          '해당 이메일로 가입된 계정이 있습니다.',
        )}`,
      );
    });

    it('정상적인 유저 정보가 있으면 토큰을 발급하고 loginSuccess로 리다이렉트 해야 합니다.', async () => {
      const tokens = {
        accessToken: 'access',
        refreshToken: 'refresh',
        refreshTokenTtl: 604800,
      };

      const replyWithCookie = {
        redirect: jest.fn(),
        setCookie: jest.fn(),
      };

      const { socialService, config, tokenService } = await setupSocialServiceTest({
        tokenService: {
          generateTokens: jest.fn().mockResolvedValue(tokens),
        },
      });

      await socialService.handleSocialCallbackResult(
        { id: 1, email: 'test@email.com', role: 'user' },
        replyWithCookie as any,
      );

      expect(tokenService.generateTokens).toHaveBeenCalled();
      expect(replyWithCookie.redirect).toHaveBeenCalledWith(
        `${config.getOrThrow('app.frontendOrigin')}/loginSuccess`,
      );
    });
  });
  describe('redirectAfterLink', () => {
    const reply = {
      redirect: jest.fn(),
    } as any;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('AlreadyLinkedException이면 실패 메시지를 쿼리로 포함하여 리다이렉트 해야 합니다.', async () => {
      const { socialService, config } = await setupSocialServiceTest();

      const error = new AlreadyLinkedException();
      const failureMessage = '이미 연동된 계정입니다.';

      await socialService.redirectAfterLink(reply, error, '/userinfo', failureMessage);

      expect(reply.redirect).toHaveBeenCalledWith(
        `${config.getOrThrow('app.frontendOrigin')}/userinfo?error=${encodeURIComponent(failureMessage)}`,
      );
    });

    it('기타 오류일 경우 쿼리 없이 successPath로 리다이렉트 해야 합니다.', async () => {
      const { socialService, config } = await setupSocialServiceTest();

      const genericError = new Error('error');
      const failureMessage = '이미 연동된 계정입니다.';

      await socialService.redirectAfterLink(reply, genericError, '/userinfo', failureMessage);

      expect(reply.redirect).toHaveBeenCalledWith(
        `${config.getOrThrow('app.frontendOrigin')}/userinfo`,
      );
    });
  });
  describe('unlinkSocialAccount', () => {
    it('유저가 없으면 UserNotFoundException을 던져야 합니다.', async () => {
      const { socialService, userRepository } = await setupSocialServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(null),
        },
      });

      await expect(socialService.unlinkSocialAccount(1, 'google')).rejects.toThrow(
        UserNotFoundException,
      );
      expect(userRepository.findOne).toHaveBeenCalledWith(1, { fields: ['id'] });
    });
    it('남은 소셜 계정이 없으면 NoRemainingAuthMethodException을 던져야 합니다.', async () => {
      const mockUser = { id: 1 };

      const { socialService, userRepository, socialAccountRepository } =
        await setupSocialServiceTest({
          userRepo: {
            findOne: jest.fn().mockResolvedValue(mockUser),
          },
          socialRepo: {
            find: jest.fn().mockResolvedValue([]),
          },
        });

      await expect(socialService.unlinkSocialAccount(1, 'google')).rejects.toThrow(
        NoRemainingAuthMethodException,
      );
      expect(userRepository.findOne).toHaveBeenCalled();
      expect(socialAccountRepository.find).toHaveBeenCalledWith({
        user: mockUser,
        provider: { $ne: 'google' },
      });
    });
    it('정상적으로 unlink되면 generateOAuthToken → revokeSocialAccess → removeAndFlush 순서로 호출되어야 합니다.', async () => {
      jest.mock('axios', () => ({
        default: {
          post: jest.fn().mockResolvedValue({}),
        },
      }));

      const mockUser = { id: 1 };
      const mockAccount = {
        provider: 'google',
        providerId: 'google-id',
      };

      const mockEntityManager = {
        removeAndFlush: jest.fn(),
      };

      const socialRepoWithEM = {
        find: jest.fn().mockResolvedValue([{ provider: 'local' }]),
        findOne: jest.fn().mockResolvedValue(mockAccount),
        getEntityManager: jest.fn().mockReturnValue(mockEntityManager),
      };

      const { socialService, tokenService } = await setupSocialServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(mockUser),
        },
        socialRepo: socialRepoWithEM,
        tokenService: {
          generateOAuthToken: jest.fn().mockResolvedValue('social-token'),
        },
      });

      await socialService.unlinkSocialAccount(1, 'google');

      expect(tokenService.generateOAuthToken).toHaveBeenCalledWith({
        provider: 'google',
        user: {
          socialAccounts: [{ provider: 'google', providerId: 'google-id' }],
        },
      });

      expect(mockEntityManager.removeAndFlush).toHaveBeenCalledWith(mockAccount);

      const axios = (await import('axios')).default;
      expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('googleapis'));
    });
    it('provider가 kakao일 때 revokeSocialAccess가 카카오 API를 호출해야 합니다.', async () => {
      jest.mock('axios', () => ({
        default: {
          post: jest.fn().mockResolvedValue({}),
        },
      }));

      const mockUser = { id: 1 };
      const mockAccount = { provider: 'kakao', providerId: 'kakao-id' };
      const persist = jest.fn();

      const { socialService } = await setupSocialServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(mockUser),
        },
        socialRepo: {
          find: jest.fn().mockResolvedValue([{ provider: 'local' }]),
          findOne: jest.fn().mockResolvedValue(mockAccount),
          getEntityManager: jest.fn().mockReturnValue({ removeAndFlush: persist }),
        },
        tokenService: {
          generateOAuthToken: jest.fn().mockResolvedValue('kakao-token'),
        },
      });

      await socialService.unlinkSocialAccount(1, 'kakao');

      const axios = (await import('axios')).default;
      expect(axios.post).toHaveBeenCalledWith('https://kapi.kakao.com/v1/user/unlink', null, {
        headers: { Authorization: 'Bearer kakao-token' },
      });
    });
    it('provider가 naver일 때 revokeSocialAccess가 네이버 API를 호출해야 합니다.', async () => {
      jest.mock('axios', () => ({
        default: {
          post: jest.fn().mockResolvedValue({}),
        },
      }));

      const mockUser = { id: 1 };
      const mockAccount = { provider: 'naver', providerId: 'naver-id' };
      const persist = jest.fn();

      const { socialService } = await setupSocialServiceTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(mockUser),
        },
        socialRepo: {
          find: jest.fn().mockResolvedValue([{ provider: 'local' }]),
          findOne: jest.fn().mockResolvedValue(mockAccount),
          getEntityManager: jest.fn().mockReturnValue({ removeAndFlush: persist }),
        },
        tokenService: {
          generateOAuthToken: jest.fn().mockResolvedValue('naver-token'),
        },
        config: {
          'oauth.naver.clientId': 'naver-client-id',
          'oauth.naver.clientSecret': 'naver-client-secret',
        },
      });

      await socialService.unlinkSocialAccount(1, 'naver');

      const axios = (await import('axios')).default;
      expect(axios.post).toHaveBeenCalledWith('https://nid.naver.com/oauth2.0/token', null, {
        params: {
          grant_type: 'delete',
          client_id: 'naver-client-id',
          client_secret: 'naver-client-secret',
          access_token: 'naver-token',
        },
      });
    });
  });
});
