import cookie from '@fastify/cookie';
import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { Redis } from 'ioredis';

import { AppModule } from '@/app.module';
import { TokenService } from '@/auth/token.service';
import { globalConfigService } from '@/config/global-config.service';
import { REDIS_CLIENT } from '@/config/redis.provider.config';

export let app: NestFastifyApplication;
export let redis: Redis;
export let jwtService: JwtService;
export let configService: ConfigService;
export let tokenService: TokenService;
export let orm: MikroORM;

beforeAll(async () => {
  const adapter = new FastifyAdapter();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication<NestFastifyApplication>(adapter);

  await app.register(cookie);

  await app.init();
  await app.listen(0);

  orm = app.get(MikroORM);
  redis = app.get<Redis>(REDIS_CLIENT);
  jwtService = app.get(JwtService);
  configService = app.get(ConfigService);
  tokenService = app.get(TokenService);

  globalConfigService(configService);

  await orm.getSchemaGenerator().refreshDatabase();
});

afterAll(async () => {
  await app.close();
  await redis.quit();
});
