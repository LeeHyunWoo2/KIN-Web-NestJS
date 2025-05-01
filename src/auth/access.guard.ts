import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { TokenService } from '@/auth/token.service';
import { AccessTokenMissingException } from '@/common/exceptions/token.exceptions';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = request.cookies?.accessToken;

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
