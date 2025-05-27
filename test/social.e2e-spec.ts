import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import * as request from 'supertest';

import { SocialAccount } from '@/user/entity/social-account.entity';
import { User } from '@/user/entity/user.entity';

import { app, tokenService } from './setup-e2e';

describe('SocialController (e2e) - 소셜 연동 해제', () => {
  let em: EntityManager;
  let accessToken: string;
  let testUser: User;

  beforeAll(async () => {
    em = app.get(EntityManager).fork();

    const user = em.create<User>('User', {
      email: 'socialuser@example.com',
      name: '소셜유저',
      role: 'user',
      marketingConsent: false,
    } as RequiredEntityData<User>);
    await em.persistAndFlush(user);
    testUser = user;

    const google = em.create<SocialAccount>('SocialAccount', {
      provider: 'google',
      providerId: 'google-id',
      socialRefreshToken: 'google-refresh-token',
      user: user,
    } as RequiredEntityData<SocialAccount>);
    const kakao = em.create<SocialAccount>('SocialAccount', {
      provider: 'kakao',
      providerId: 'kakao-id',
      socialRefreshToken: 'kakao-refresh-token',
      user: user,
    } as RequiredEntityData<SocialAccount>);
    await em.persistAndFlush([google, kakao]);

    const tokenPair = await tokenService.generateTokens(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      3600,
    );
    accessToken = tokenPair.accessToken;
  });

  it('연동된 소셜 계정을 정상적으로 해제해야 합니다.', async () => {
    const res = await request(app.getHttpServer())
      .delete('/auth/social/test/google')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);

    const remaining = await em.find(SocialAccount, { user: testUser });
    const providers = remaining.map((a) => a.provider);

    expect(providers).not.toContain('google');
    expect(providers).toContain('kakao');
  });
});
