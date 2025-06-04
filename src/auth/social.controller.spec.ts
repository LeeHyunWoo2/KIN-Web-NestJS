import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyReply, FastifyRequest } from 'fastify';

import { AccessGuard } from '@/auth/access.guard';
import { SocialController } from '@/auth/social.controller';
import { SocialService } from '@/auth/social.service';
import { TokenService } from '@/auth/token.service';
import {
  DecodedUser,
  RedirectAfterLinkInput,
  SocialCallbackInput,
  UnlinkSocialAccountInput,
} from '@/auth/types/auth-service.types';
import { UserRole } from '@/types/user-entity.types';

import { createMockConfigService, MockConfigType } from '../../test/utils/config.mock';

interface SetupOptions {
  socialService?: Partial<SocialService>;
  config?: MockConfigType;
}

const setupSocialControllerTest = async (
  overrides: SetupOptions = {},
): Promise<{
  controller: SocialController;
  socialService: jest.Mocked<SocialService>;
  config: ConfigService;
}> => {
  const socialService = {
    handleSocialCallbackResult: jest.fn(),
    redirectAfterLink: jest.fn(),
    unlinkSocialAccount: jest.fn(),
    ...overrides.socialService,
  } as unknown as jest.Mocked<SocialService>;

  const defaultConfig = {
    'app.nodeEnv': 'test',
  };

  const config = createMockConfigService({
    ...defaultConfig,
    ...(overrides.config || {}),
  });

  const moduleRef: TestingModule = await Test.createTestingModule({
    controllers: [SocialController],
    providers: [
      { provide: SocialService, useValue: socialService },
      { provide: AccessGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
      { provide: TokenService, useValue: {} },
      { provide: ConfigService, useValue: config },
    ],
  }).compile();

  return {
    controller: moduleRef.get(SocialController),
    socialService,
    config: moduleRef.get(ConfigService),
  };
};

describe('SocialController', () => {
  describe('callbacks', () => {
    it.each([
      ['googleCallback', { id: 1, email: 'test@test.com', role: 'user' as UserRole }, undefined],
      ['kakaoCallback', { id: 2, email: 'test2@test.com', role: 'user' as UserRole }, undefined],
      ['naverCallback', { id: 3, email: 'test3@test.com', role: 'user' as UserRole }, undefined],
    ])('%s: social callback을 처리해야 합니다', async (method, user, error) => {
      const req = { authResult: { user, error } } as FastifyRequest;
      const reply = {} as FastifyReply;
      const input: SocialCallbackInput = { user, error, reply };

      const { controller, socialService } = await setupSocialControllerTest();

      await (controller[method] as any).call(controller, req, reply);

      expect(socialService.handleSocialCallbackResult).toHaveBeenCalledWith(input);
    });
  });

  describe('link callbacks', () => {
    it.each([
      ['google', 'linkGoogleCallback'],
      ['kakao', 'linkKakaoCallback'],
      ['naver', 'linkNaverCallback'],
    ])('%s link callback을 처리해야 합니다', async (_provider, method) => {
      const req = { authResult: { error: undefined } } as FastifyRequest;
      const reply = {} as FastifyReply;
      const input: RedirectAfterLinkInput = { error: undefined, reply };

      const { controller, socialService } = await setupSocialControllerTest();

      await (controller[method] as any).call(controller, req, reply);
      expect(socialService.redirectAfterLink).toHaveBeenCalledWith(input);
    });
  });

  describe('unlinkSocial', () => {
    it('unlinkSocialAccount를 호출해야 합니다', async () => {
      const user: DecodedUser = { id: 1, email: 'test@test.com', role: 'user' };
      const provider = 'google';
      const input: UnlinkSocialAccountInput = { id: user.id, provider };

      const { controller, socialService } = await setupSocialControllerTest();

      await controller.unlinkSocial(user, provider as any);

      expect(socialService.unlinkSocialAccount).toHaveBeenCalledWith(input);
    });
  });

  describe('login & link methods', () => {
    it.each([
      ['googleLogin', 'googleLogin'],
      ['kakaoLogin', 'kakaoLogin'],
      ['naverLogin', 'naverLogin'],
      ['linkGoogle', 'linkGoogle'],
      ['linkKakao', 'linkKakao'],
      ['linkNaver', 'linkNaver'],
    ])('%s 메서드를 호출할 수 있어야 합니다', async (_name, method) => {
      const { controller } = await setupSocialControllerTest();

      await expect((controller[method] as any).call(controller)).resolves.toBeUndefined();
    });
  });
});
