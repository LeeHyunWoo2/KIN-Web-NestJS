import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const client = new Redis({
      host: configService.getOrThrow<string>('redis.host'),
      port: configService.getOrThrow<number>('redis.port'),
      password: configService.getOrThrow<string>('redis.password'),
      db: 0,
    });

    client.on('connect', () => console.log('Redis connected'));
    client.on('error', (err) => console.error('Redis error', err));

    return client;
  },
};
