import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import * as request from 'supertest';

import { SocialAccount } from '@/user/entity/social-account.entity';
import { User } from '@/user/entity/user.entity';

import { app, tokenService } from './setup-e2e';
import { createUserAndLogin } from './utils/create-user-and-login';
import { generateTokenCookies } from './utils/generate-token-cookies';

describe('UserController (e2e)', () => {
  const testUser = {
    username: 'testuser',
    password: 'Test1234!',
    email: 'test@example.com',
    name: '테스터',
    marketingConsent: false,
  };

  let em: EntityManager;
  let cookies: string[];
  let cookiesForSocial: string[];
  let serverUrl: string;

  beforeAll(async () => {
    serverUrl = await app.getUrl();
    cookies = await createUserAndLogin(app, testUser);

    em = app.get(EntityManager).fork();

    const socialUser = em.create<User>('User', {
      email: 'socialuser@example.com',
      name: '소셜유저',
      role: 'user',
      marketingConsent: false,
    } as RequiredEntityData<User>);
    await em.persistAndFlush(socialUser);

    const google = em.create<SocialAccount>('SocialAccount', {
      provider: 'google',
      providerId: 'google-id',
      user: socialUser,
    } as RequiredEntityData<SocialAccount>);
    await em.persistAndFlush(google);

    cookiesForSocial = await generateTokenCookies(tokenService, {
      id: socialUser.id,
      email: socialUser.email,
      role: socialUser.role,
    });
  });

  it('내 public 프로필을 조회해야 합니다.', async () => {
    const res = await request(serverUrl).get('/user').set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name');
  });

  it('내 user info를 조회해야 합니다.', async () => {
    const res = await request(serverUrl).post('/user').set('Cookie', cookies);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('username');
  });

  it('정상적으로 비밀번호를 재설정해야 합니다.', async () => {
    const res = await request(serverUrl).put('/user/password').send({
      email: testUser.email,
      newPassword: 'NewPass123!',
    });

    expect(res.status).toBe(200);
  });

  it('로컬 계정을 성공적으로 추가해야 합니다.', async () => {
    const res = await request(serverUrl)
      .post('/user/change-local')
      .set('Cookie', cookiesForSocial)
      .send({
        username: 'linkedlocal',
        email: 'linked@email.com',
        password: 'Secure1@pass',
      });

    expect(res.status).toBe(201);
  });

  describe('유저 찾기', () => {
    it('존재하는 이메일로 조회 시 계정 유형이 SNS 또는 Local이어야 합니다.', async () => {
      const res = await request(serverUrl).post('/user/find').send({
        input: testUser.email,
        inputType: 'email',
        fetchUsername: true,
      });

      expect(res.status).toBe(200);
      expect(res.body.signal).toBe('user_found');
      expect(['Local', 'SNS']).toContain(res.body.accountType);
    });

    it('존재하지 않는 이메일이면 user_not_found를 반환해야 합니다.', async () => {
      const res = await request(serverUrl).post('/user/find').send({
        input: 'nonexistent@email.com',
        inputType: 'email',
        fetchUsername: true,
      });

      expect(res.status).toBe(200);
      expect(res.body.signal).toBe('user_not_found');
    });

    it('존재하는 username으로 조회 시 username을 반환해야 합니다.', async () => {
      const res = await request(serverUrl).post('/user/find').send({
        input: testUser.username,
        inputType: 'username',
        fetchUsername: true,
      });

      expect(res.status).toBe(200);
      expect(res.body.signal).toBe('user_found');
      expect(res.body.username).toBe(testUser.username);
    });
  });

  it('유저 이름을 업데이트해야 합니다.', async () => {
    const res = await request(serverUrl)
      .put('/user')
      .set('Cookie', cookies)
      .send({ name: '업데이트이름' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('업데이트이름');
  });

  it('내 계정을 탈퇴해야 합니다.', async () => {
    const res = await request(serverUrl).delete('/user').set('Cookie', cookies);
    expect(res.status).toBe(204);
  });
});
