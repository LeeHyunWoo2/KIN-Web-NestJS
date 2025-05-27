/* eslint-disable */
import cookie from '@fastify/cookie';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyServerOptions } from 'fastify';
import { Logger } from 'nestjs-pino';

import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { setLogger } from '@/common/logger/log-structured-error';
import { globalConfigService } from '@/config/global-config.service';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';
import { randomUUID } from 'crypto';

async function bootstrap(): Promise<void> {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const configService = appContext.get(ConfigService);
  const httpsOptions = configService.get<FastifyServerOptions>('security.httpsOptions');
  globalConfigService(configService);
  await appContext.close();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(httpsOptions),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.register(cookie);

  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onRequest', async (req, res) => {
      const requestIdHeader = Array.isArray(req.headers['x-request-id'])
        ? req.headers['x-request-id'][0]
        : req.headers['x-request-id'];
      req.requestId = requestIdHeader ?? randomUUID();
      res.header('x-request-id', req.requestId);
    });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin: configService.getOrThrow<string>('app.frontendOrigin'),
    credentials: true,
  });

  const logger = app.get(Logger);

  process.on('uncaughtException', (err) => {
    logger.error({
      type: 'FATAL_UNCAUGHT_EXCEPTION',
      message: err.message,
      stack: err.stack,
    });
  });

  process.on('unhandledRejection', (reason: any) => {
    logger.error({
      type: 'FATAL_UNHANDLED_REJECTION',
      message: reason?.message ?? String(reason),
      stack: reason?.stack ?? undefined,
    });
  });

  setLogger(logger);

  const port = configService.get<number>('app.port') ?? 5000;
  await app.listen(port, '0.0.0.0');

  logger.log(`Server is running on: ${await app.getUrl()}`, 'Bootstrap');
}

void bootstrap();
