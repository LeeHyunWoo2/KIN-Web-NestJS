import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

import { SEQUENTIAL_KEY } from '../decorators/sequential.decorator';

/**
 * 현재 프로젝트에 순차처리 로직은 적용되지 않습니다.
 * 향후 @Sequential 데코레이터가 붙은 API에서만 동시성 제어를 수행할 수 있도록 구조를 미리 염두하고 있습니다.
 */
@Injectable()
export class SequentialInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isSequential = this.reflector.get<boolean>(SEQUENTIAL_KEY, context.getHandler());

    // TODO: 실제 동시성 처리 로직은 필요 시 구현 예정
    if (isSequential) {
      // Redis 락이나 뮤텍스 적용 가능
    }

    return next.handle();
  }
}
