import { InternalServerErrorException } from '@nestjs/common';

import { setupNaverStrategyTest } from '../../../test/utils/naver-strategy.test-helper';

describe('NaverStrategy', () => {
  describe('validate', () => {
    const baseReq = {} as any;
    const baseAccessToken = 'access-token';
    const baseRefreshToken = 'refresh-token';

    it('이메일이 없으면 InternalServerErrorException 을 던져야 합니다.', async () => {
      const profile = {
        id: 'naver-id',
        _json: {
          profile_image: 'profile.png',
        },
      } as any;

      const { strategy } = await setupNaverStrategyTest();

      await expect(
        strategy.validate(baseReq, baseAccessToken, baseRefreshToken, profile),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('기존 유저가 있으면 findUserBySocialAccount 를 호출하고 결과를 반환해야 합니다.', async () => {
      const profile = {
        id: 'naver-id',
        _json: {
          email: 'test@email.com',
          profile_image: 'profile.png',
        },
      } as any;

      const existingUser = { id: 1, email: 'test@email.com', role: 'user' };

      const { strategy, userService } = await setupNaverStrategyTest({
        userService: {
          findUserBySocialAccount: jest.fn().mockResolvedValue(existingUser),
        },
      });

      const result = await strategy.validate(baseReq, baseAccessToken, baseRefreshToken, profile);

      expect(userService.findUserBySocialAccount).toHaveBeenCalledWith('naver', 'naver-id');
      expect(result).toBe(existingUser);
    });

    it('기존 유저가 없으면 createSocialUser 를 호출해야 합니다.', async () => {
      const profile = {
        id: 'naver-id',
        displayName: 'Tester',
        _json: {
          email: 'new@email.com',
          profile_image: 'profile.png',
        },
      } as any;

      const newUser = { id: 2, email: 'new@email.com', role: 'user' };

      const { strategy, userService } = await setupNaverStrategyTest({
        userService: {
          findUserBySocialAccount: jest.fn().mockResolvedValue(undefined),
          createSocialUser: jest.fn().mockResolvedValue(newUser),
        },
      });

      const result = await strategy.validate(baseReq, baseAccessToken, baseRefreshToken, profile);

      expect(userService.createSocialUser).toHaveBeenCalledWith({
        provider: 'naver',
        providerId: 'naver-id',
        email: 'new@email.com',
        name: 'Tester',
        profileIcon: 'profile.png',
        socialRefreshToken: baseRefreshToken,
      });

      expect(result).toBe(newUser);
    });
  });
});
