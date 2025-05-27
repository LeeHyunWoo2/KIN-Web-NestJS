import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest } from 'fastify';

import { TokenService } from '@/auth/token.service';
import { AccessTokenMissingException } from '@/common/exceptions';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * E2E 테스트 환경(supertest)에서 cookie 인증이 작동하지 않기 때문에,
   * NODE_ENV=test 일 때만 Authorization 헤더 fallback 허용
   */

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token =
      request.cookies?.accessToken ??
      (this.configService.get<string>('app.nodeEnv') === 'test'
        ? request.headers['authorization']?.split('Bearer ')[1]
        : undefined);

    if (!token) {
      throw new AccessTokenMissingException();
    }

    try {
      request.user = await this.tokenService.verifyAccessToken(token);
      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException('접근이 거부되었습니다.');
    }
  }
}
