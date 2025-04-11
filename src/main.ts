import cookie from '@fastify/cookie';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { FastifyServerOptions } from 'fastify';

import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
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

  const options = new DocumentBuilder()
    .setTitle('Keep Idea Note API')
    .setDescription('Auth, Notes, User, Visitor 등 API 문서')
    .setVersion('1.0')
    .addCookieAuth('accessToken')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin: configService.get<string>('app.frontendOrigin') ?? 'http://localhost:3000',
    credentials: true,
  });

  const port = configService.get<number>('app.port') ?? 5000;
  await app.listen(port);
  console.log(`Server is running on: ${await app.getUrl()}`);
}

void bootstrap();
