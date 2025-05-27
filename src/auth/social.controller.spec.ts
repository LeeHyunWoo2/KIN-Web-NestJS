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

describe('SocialController', () => {
  let controller: SocialController;
  let socialService: jest.Mocked<SocialService>;

  beforeEach(async () => {
    const mockAccessGuard = { canActivate: jest.fn().mockReturnValue(true) };
    const mockSocialService = {
      handleSocialCallbackResult: jest.fn(),
      redirectAfterLink: jest.fn(),
      unlinkSocialAccount: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SocialController],
      providers: [
        { provide: SocialService, useValue: mockSocialService },
        { provide: AccessGuard, useValue: mockAccessGuard },
        { provide: TokenService, useValue: {} },
      ],
    }).compile();

    controller = moduleRef.get(SocialController);
    socialService = moduleRef.get(SocialService);
  });

  describe('googleCallback', () => {
    it('social callback을 처리해야 합니다', async () => {
      const req = {
        authResult: { user: { id: 1, email: 'test@test.com', role: 'user' }, error: undefined },
      } as FastifyRequest;
      const reply = {} as FastifyReply;
      const input: SocialCallbackInput = {
        user: req.authResult?.user,
        error: req.authResult?.error,
        reply,
      };

      await controller.googleCallback(req, reply);
      expect(socialService.handleSocialCallbackResult).toHaveBeenCalledWith(input);
    });
  });

  describe('kakaoCallback', () => {
    it('social callback을 처리해야 합니다', async () => {
      const req = {
        authResult: { user: { id: 2, email: 'test2@test.com', role: 'user' }, error: undefined },
      } as FastifyRequest;
      const reply = {} as FastifyReply;
      const input: SocialCallbackInput = {
        user: req.authResult?.user,
        error: req.authResult?.error,
        reply,
      };

      await controller.kakaoCallback(req, reply);
      expect(socialService.handleSocialCallbackResult).toHaveBeenCalledWith(input);
    });
  });

  describe('naverCallback', () => {
    it('social callback을 처리해야 합니다', async () => {
      const req = {
        authResult: { user: { id: 3, email: 'test3@test.com', role: 'user' }, error: undefined },
      } as FastifyRequest;
      const reply = {} as FastifyReply;
      const input: SocialCallbackInput = {
        user: req.authResult?.user,
        error: req.authResult?.error,
        reply,
      };

      await controller.naverCallback(req, reply);
      expect(socialService.handleSocialCallbackResult).toHaveBeenCalledWith(input);
    });
  });

  describe('link callbacks', () => {
    it.each([
      ['google', 'linkGoogleCallback'],
      ['kakao', 'linkKakaoCallback'],
      ['naver', 'linkNaverCallback'],
    ] as const)('%s link callback을 처리해야 합니다', async (_provider, methodName) => {
      const req = { authResult: { error: undefined } } as unknown as FastifyRequest;
      const reply = {} as unknown as FastifyReply;
      const input: RedirectAfterLinkInput = {
        error: req.authResult?.error,
        reply,
      };

      await (controller[methodName] as any).call(controller, req, reply);

      expect(socialService.redirectAfterLink).toHaveBeenCalledWith(input);
    });
  });

  describe('unlinkSocial', () => {
    it('unlinkSocialAccount를 호출해야 합니다', async () => {
      const user: DecodedUser = { id: 1, email: 'test@test.com', role: 'user' };
      const provider = 'google';
      const input: UnlinkSocialAccountInput = {
        id: user.id,
        provider,
      };

      await controller.unlinkSocial(user, provider as any);
      expect(socialService.unlinkSocialAccount).toHaveBeenCalledWith(input);
    });
  });
  describe('login & link methods', () => {
    it('googleLogin 메서드를 호출할 수 있어야 합니다', async () => {
      await expect(controller.googleLogin()).resolves.toBeUndefined();
    });

    it('kakaoLogin 메서드를 호출할 수 있어야 합니다', async () => {
      await expect(controller.kakaoLogin()).resolves.toBeUndefined();
    });

    it('naverLogin 메서드를 호출할 수 있어야 합니다', async () => {
      await expect(controller.naverLogin()).resolves.toBeUndefined();
    });

    it('linkGoogle 메서드를 호출할 수 있어야 합니다', async () => {
      await expect(controller.linkGoogle()).resolves.toBeUndefined();
    });

    it('linkKakao 메서드를 호출할 수 있어야 합니다', async () => {
      await expect(controller.linkKakao()).resolves.toBeUndefined();
    });

    it('linkNaver 메서드를 호출할 수 있어야 합니다', async () => {
      await expect(controller.linkNaver()).resolves.toBeUndefined();
    });
  });
});
