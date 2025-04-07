import {Router} from 'express';
import passport from 'passport';
import {
  handleSocialCallback,
  handleSocialLinkCallback,
  unlinkSocialAccount
} from '@/controllers/auth/socialController';
import {injectAuthenticatedUser} from '@/middleware/auth/injectAuthenticatedUser';
import {Provider, getPassportOptions} from "@/utils/getPassportOptions";

const socialRouter: Router = Router();


// 소셜 로그인 진입
socialRouter.get('/:provider', (req, res, next) => {
  const provider = req.params.provider as Provider;
  try {
    const { strategy, options } = getPassportOptions(provider, 'login');
    passport.authenticate(strategy, options)(req, res, next);
  } catch (error) {
    if (error instanceof Error){
      res.status(400).json({ error: error.message });
    } else {
      res.status(400)
    }
  }
});

// 소셜 로그인 콜백
socialRouter.get('/callback/:provider', (req, res) => {
  const provider = req.params.provider as Provider;
  try {
    const { strategy, options } = getPassportOptions(provider, 'login-callback');
    passport.authenticate(strategy, options)(req, res, async () => {
      await handleSocialCallback(req, res);
    });
  } catch (error) {
    if (error instanceof Error){
      res.status(400).json({ error: error.message });
    } else {
      res.status(400)
    }
  }
});

// 일반 계정에 소셜 계정 추가 연동
socialRouter.get('/link/:provider', injectAuthenticatedUser, (req, res, next) => {
  const provider = req.params.provider as Provider;
  try {
    const { strategy, options } = getPassportOptions(provider, 'link');
    passport.authenticate(strategy, options)(req, res, next);
  } catch (error) {
    if (error instanceof Error){
      res.status(400).json({ error: error.message });
    } else {
      res.status(400)
    }
  }
});

// 추가 연동 콜백
socialRouter.get('/link/callback/:provider', injectAuthenticatedUser, (req, res) => {
  const provider = req.params.provider as Provider;
  try {
    const { strategy, options } = getPassportOptions(provider, 'link-callback');
    passport.authenticate(strategy, options)(req, res, () => {
      handleSocialLinkCallback(req, res);
    });
  } catch (error) {
    if (error instanceof Error){
      res.status(400).json({ error: error.message });
    } else {
      res.status(400)
    }
  }
});

// 소셜 계정 연동 해제
socialRouter.delete('/:provider', injectAuthenticatedUser, unlinkSocialAccount);

export { socialRouter };