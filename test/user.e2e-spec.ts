import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import * as request from 'supertest';

import { SocialAccount } from '@/user/entity/social-account.entity';
import { User } from '@/user/entity/user.entity';

import { app, tokenService } from './setup-e2e';

describe('UserController (e2e)', () => {
  const testUser = {
    username: 'testuser',
    password: 'Test1234!',
    email: 'test@example.com',
    name: '테스터',
    marketingConsent: false,
  };

  let em: EntityManager;
  let accessToken: string;
  let refreshToken: string;
  let accessTokenForSocial: string;

  beforeAll(async () => {
    await request(app.getHttpServer()).post('/auth/register').send(testUser);

    const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
      username: testUser.username,
      password: testUser.password,
      rememberMe: false,
    });

    accessToken = loginResponse.body.accessToken;
    refreshToken = loginResponse.body.refreshToken;

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

    const tokenPair = await tokenService.generateTokens(
      {
        id: socialUser.id,
        email: socialUser.email,
        role: socialUser.role,
      },
      3600,
    );
    accessTokenForSocial = tokenPair.accessToken;
  });

  it('내 public 프로필을 조회해야 합니다.', async () => {
    const response = await request(app.getHttpServer())
      .get('/user/test')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name');
  });

  it('내 user info를 조회해야 합니다.', async () => {
    const response = await request(app.getHttpServer())
      .post('/user/test')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('username');
  });

  it('정상적으로 비밀번호를 재설정해야 합니다.', async () => {
    const response = await request(app.getHttpServer()).put('/user/password').send({
      email: testUser.email,
      newPassword: 'NewPass123!',
    });

    expect(response.status).toBe(200);
  });

  it('로컬 계정을 성공적으로 추가해야 합니다.', async () => {
    const response = await request(app.getHttpServer())
      .post('/user/test/add-local')
      .set('Authorization', `Bearer ${accessTokenForSocial}`)
      .send({
        username: 'linkedlocal',
        email: 'linked@email.com',
        password: 'Secure1@pass',
      });

    expect(response.status).toBe(201);
  });

  describe('유저 찾기', () => {
    it('존재하는 이메일로 조회 시 계정 유형이 SNS 또는 Local이어야 합니다.', async () => {
      const response = await request(app.getHttpServer()).post('/user/find').send({
        input: testUser.email,
        inputType: 'email',
        fetchUsername: true,
      });

      expect(response.status).toBe(200);
      expect(response.body.signal).toBe('user_found');
      expect(['Local', 'SNS']).toContain(response.body.accountType);
    });

    it('존재하지 않는 이메일이면 user_not_found를 반환해야 합니다.', async () => {
      const response = await request(app.getHttpServer()).post('/user/find').send({
        input: 'nonexistent@email.com',
        inputType: 'email',
        fetchUsername: true,
      });

      expect(response.status).toBe(200);
      expect(response.body.signal).toBe('user_not_found');
    });

    it('존재하는 username으로 조회 시 username을 반환해야 합니다.', async () => {
      const response = await request(app.getHttpServer()).post('/user/find').send({
        input: testUser.username,
        inputType: 'username',
        fetchUsername: true,
      });

      expect(response.status).toBe(200);
      expect(response.body.signal).toBe('user_found');
      expect(response.body.username).toBe(testUser.username);
    });
  });

  it('유저 이름을 업데이트해야 합니다.', async () => {
    const response = await request(app.getHttpServer())
      .put('/user/test')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: '업데이트이름' });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('업데이트이름');
  });

  it('내 계정을 탈퇴해야 합니다.', async () => {
    const response = await request(app.getHttpServer())
      .delete('/user/test')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Refresh-Token', refreshToken);

    expect(response.status).toBe(204);
  });
});
