import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { TokenService } from '@/auth/services/token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = request.cookies?.accessToken;

    if (!token) {
      throw new UnauthorizedException('Access token is missing');
    }

    try {
      const decoded = await this.tokenService.verifyAccessToken(token);
      request.user = decoded;
      return true;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new UnauthorizedException(`Access denied. ${error?.message ?? 'Invalid token'}`);
    }
  }
}
