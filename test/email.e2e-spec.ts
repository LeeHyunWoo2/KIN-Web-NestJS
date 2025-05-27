import * as request from 'supertest';

import { app, configService, jwtService } from './setup-e2e';

describe('EmailController (e2e)', () => {
  const validEmail = 'user@example.com';

  it('이메일 인증 요청을 성공해야 합니다.', async () => {
    const res = await request(app.getHttpServer()).post('/auth/email').send({ email: validEmail });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      message: '이메일 인증 링크가 전송되었습니다.',
    });
  });

  it('유효한 토큰으로 이메일 인증이 성공해야 합니다.', async () => {
    const token = await jwtService.signAsync(
      { email: validEmail },
      {
        secret: configService.get<string>('auth.emailTokenSecret'),
        expiresIn: '1h',
      },
    );

    const res = await request(app.getHttpServer()).get(`/auth/email?token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      message: '이메일 인증이 완료되었습니다.',
      email: { email: validEmail },
    });
  });
});
