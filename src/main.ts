/* eslint-disable */
import cookie from '@fastify/cookie';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  const config = new DocumentBuilder()
    .setTitle('Keep Idea Note API')
    .setDescription('회원 인증, 유저 정보 REST API')
    .setVersion('1.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: '64KcIO2GoOyKpCDqsJzrsJzsnpDqsIAg65Cg6rGw7JW8',
      in: 'header',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      displayRequestDuration: true,
    },
  });

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
