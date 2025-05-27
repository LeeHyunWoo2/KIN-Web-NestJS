import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { Observable, tap } from 'rxjs';

import { TokenPair } from '@/auth/types/auth-service.types';
import { setAuthCookies } from '@/auth/utils/set-auth-cookies.util';

@Injectable()
export class SetAuthCookiesInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<TokenPair> {
    const reply = context.switchToHttp().getResponse<FastifyReply>();

    return next.handle().pipe(
      tap((data: TokenPair) => {
        if (!data?.accessToken || !data?.refreshToken) return;
        setAuthCookies({ reply, tokens: data });
      }),
    );
  }
}
