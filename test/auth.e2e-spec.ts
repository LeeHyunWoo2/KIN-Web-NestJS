import * as request from 'supertest';

import { app, redis } from './setup-e2e';
import { createUserAndLogin } from './utils/create-user-and-login';

describe('AuthController (e2e)', () => {
  const testUser = {
    username: 'testuser',
    password: 'Test1234!',
    email: 'test@example.com',
    name: '테스터',
    marketingConsent: false,
  };

  let cookies: string[];
  let serverUrl: string;

  beforeAll(async () => {
    serverUrl = await app.getUrl();
    cookies = await createUserAndLogin(app, testUser);
  });

  it('세션 확인이 성공해야 합니다.', async () => {
    const res = await request(serverUrl).get('/auth/session').set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email');
    expect(res.body).toHaveProperty('role');
  });

  it('토큰 재발급 시 쿠키에 새로운 토큰이 담겨야 합니다.', async () => {
    const res = await request(serverUrl).post('/auth/refresh').set('Cookie', cookies);
    expect(res.status).toBe(201);
  });

  it('로그아웃 시 쿠키가 제거되고 accessToken이 블랙리스트에 등록되어야 합니다.', async () => {
    const res = await request(serverUrl).post('/auth/logout').set('Cookie', cookies);
    expect(res.status).toBe(204);

    const token = cookies
      .find((c) => c.startsWith('accessToken='))
      ?.split(';')[0]
      ?.split('=')[1];

    expect(token).toBeDefined();

    const blacklisted = await redis.exists(`blacklist:${token}`);
    expect(blacklisted).toBe(1);
  });
});
