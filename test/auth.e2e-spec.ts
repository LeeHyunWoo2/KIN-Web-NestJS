import * as request from 'supertest';

import { app, redis } from './setup-e2e';

describe('AuthController (e2e)', () => {
  const testUser = {
    username: 'testuser',
    password: 'Test1234!',
    email: 'test@example.com',
    name: '테스터',
    marketingConsent: false,
  };

  let accessToken: string;
  let refreshToken: string;

  it('회원가입이 성공해야 합니다.', async () => {
    const response = await request(app.getHttpServer()).post('/auth/register').send(testUser);
    expect(response.status).toBe(201);
  });

  it('로그인 시 토큰이 응답되어야 하고, Redis에 refreshToken이 저장되어야 합니다.', async () => {
    const response = await request(app.getHttpServer()).post('/auth/login').send({
      username: testUser.username,
      password: testUser.password,
      rememberMe: false,
    });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();

    accessToken = response.body.accessToken;
    refreshToken = response.body.refreshToken;

    const stored = await redis.get('refreshToken:1');
    expect(stored).toBeDefined();
  });

  it('세션 확인이 성공해야 합니다.', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/test/session')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email');
    expect(response.body).toHaveProperty('role');
  });

  it('토큰 재발급 시 새로운 토큰이 응답되어야 하고 accessToken을 갱신해야 합니다.', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/test/refresh')
      .set('X-Refresh-Token', refreshToken);

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();

    accessToken = response.body.accessToken;
    refreshToken = response.body.refreshToken;
  });

  it('로그아웃 시 accessToken이 블랙리스트에 등록되어야 합니다.', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/test/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Refresh-Token', refreshToken);

    expect(response.status).toBe(204);

    const blacklisted = await redis.exists(`blacklist:${accessToken}`);
    expect(blacklisted).toBe(1);
  });
});
