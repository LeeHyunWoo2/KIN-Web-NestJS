/* eslint-disable */
import cookie from '@fastify/cookie';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyServerOptions } from 'fastify';
import { Logger } from 'nestjs-pino';

import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { setLogger } from '@/common/log-structured-error';
import { globalConfigService } from '@/config/global-config.service';

import { AppModule } from './app.module';

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

  await app.register(cookie);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin: configService.get<string>('app.frontendOrigin') ?? 'http://localhost:3000',
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
  await app.listen(port);

  logger.log(`Server is running on: ${await app.getUrl()}`, 'Bootstrap');
}

void bootstrap();
