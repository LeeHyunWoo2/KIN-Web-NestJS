import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { TokenService } from '@/auth/token.service';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = request.cookies?.accessToken;

    if (!token) {
      throw new UnauthorizedException('Access token is missing');
    }

    try {
      request.user = await this.tokenService.verifyAccessToken(token);
      return true;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new UnauthorizedException(`Access denied. ${error?.message ?? 'Invalid token'}`);
    }
  }
}
