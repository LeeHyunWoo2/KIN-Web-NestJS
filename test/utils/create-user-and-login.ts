import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { CreateUserInput } from '@/auth/types/auth-service.types';

export const createUserAndLogin = async (
  app: INestApplication,
  userData: CreateUserInput,
): Promise<string[]> => {
  const serverUrl = await app.getUrl();

  await request(serverUrl).post('/auth/register').send(userData);

  const res = await request(serverUrl).post('/auth/login').send({
    username: userData.username,
    password: userData.password,
    rememberMe: false,
  });

  const setCookie = res.headers['set-cookie'];
  if (!setCookie) throw new Error('Set-Cookie 헤더가 없습니다.');
  return Array.isArray(setCookie) ? setCookie : [setCookie];
};
