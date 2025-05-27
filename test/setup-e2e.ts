import cookie from '@fastify/cookie';
import { MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { Redis } from 'ioredis';

import { AppModule } from '@/app.module';
import { TokenService } from '@/auth/token.service';
import { globalConfigService } from '@/config/global-config.service';
import { REDIS_CLIENT } from '@/config/redis.provider.config';

export let app: INestApplication;
export let redis: Redis;
export let jwtService: JwtService;
export let configService: ConfigService;
export let tokenService: TokenService;

beforeAll(async () => {
  const fastifyAdapter = new FastifyAdapter();
  fastifyAdapter.register(cookie);

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();

  const orm = app.get(MikroORM);
  await orm.getSchemaGenerator().refreshDatabase();

  redis = app.get<Redis>(REDIS_CLIENT);
  jwtService = app.get(JwtService);
  configService = app.get(ConfigService);
  tokenService = app.get(TokenService);

  globalConfigService(configService);
});

afterAll(async () => {
  await app.close();
  await redis.quit();
});
