import { AlreadyLinkedException } from '@/common/exceptions/auth.exceptions';
import { AccessTokenMissingException } from '@/common/exceptions/token.exceptions';
import { UserNotFoundException } from '@/common/exceptions/user.exceptions';

import { setupNaverLinkStrategyTest } from '../../../test/utils/naver-link-strategy.test-helper';

describe('NaverLinkStrategy', () => {
  describe('validate', () => {
    const baseAccessToken = 'access-token';
    const baseRefreshToken = 'refresh-token';

    it('req.user.id가 없으면 AccessTokenMissingException 을 던져야 합니다.', async () => {
      const { strategy } = await setupNaverLinkStrategyTest();
      const req = { user: undefined } as any;

      const profile = { id: 'naver-id' } as any;

      await expect(
        strategy.validate(req, baseAccessToken, baseRefreshToken, profile),
      ).rejects.toThrow(AccessTokenMissingException);
    });

    it('유저가 존재하지 않으면 UserNotFoundException 을 던져야 합니다.', async () => {
      const { strategy, userRepository } = await setupNaverLinkStrategyTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(null),
        },
      });

      const req = { user: { id: 1 } } as any;
      const profile = { id: 'naver-id' } as any;

      await expect(
        strategy.validate(req, baseAccessToken, baseRefreshToken, profile),
      ).rejects.toThrow(UserNotFoundException);

      expect(userRepository.findOne).toHaveBeenCalledWith(1);
    });

    it('이미 연동된 계정이면 AlreadyLinkedException 을 던져야 합니다.', async () => {
      const mockUser = { id: 1 };
      const existing = { providerId: 'naver-id' };

      const { strategy } = await setupNaverLinkStrategyTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(mockUser),
        },
        socialRepo: {
          findOne: jest.fn().mockResolvedValue(existing),
        },
      });

      const req = { user: { id: 1 } } as any;
      const profile = { id: 'naver-id' } as any;

      await expect(
        strategy.validate(req, baseAccessToken, baseRefreshToken, profile),
      ).rejects.toThrow(AlreadyLinkedException);
    });

    it('정상적으로 소셜 계정을 생성하고 AccessTokenPayload를 반환해야 합니다.', async () => {
      const mockUser = {
        id: 1,
        email: 'user@email.com',
        role: 'user',
      };

      const mockSocialAccount = { providerId: 'naver-id' };
      const persistAndFlush = jest.fn();

      const { strategy, socialAccountRepository } = await setupNaverLinkStrategyTest({
        userRepo: {
          findOne: jest.fn().mockResolvedValue(mockUser),
        },
        socialRepo: {
          findOne: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockReturnValue(mockSocialAccount),
          getEntityManager: jest.fn().mockReturnValue({ persistAndFlush }),
        },
      });

      const req = { user: { id: 1 } } as any;
      const profile = {
        id: 'naver-id',
        provider: 'naver',
        displayName: 'Test User',
        _json: {
          email: 'user@email.com',
          profile_image: 'profile.png',
        },
      } as any;

      const result = await strategy.validate(req, baseAccessToken, baseRefreshToken, profile);

      expect(socialAccountRepository.create).toHaveBeenCalled();
      expect(persistAndFlush).toHaveBeenCalledWith(mockSocialAccount);
      expect(result).toEqual({
        id: 1,
        email: 'user@email.com',
        role: 'user',
      });
    });
  });
});
