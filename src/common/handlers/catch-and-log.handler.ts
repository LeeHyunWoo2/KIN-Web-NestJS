import { Aspect, LazyDecorator, WrapParams } from '@toss/nestjs-aop';

import { logError } from '@/common/log-error';

import { CATCH_AND_LOG } from '../symbols/catch-and-log.symbol';

@Aspect(CATCH_AND_LOG)
export class CatchAndLogHandler implements LazyDecorator {
  wrap({ method }: WrapParams): (...args: any[]) => any {
    return async (...args: any[]) => {
      try {
        return await method(...args);
      } catch (error) {
        const req = args?.[0]?.raw?.req ?? args?.[0]?.req ?? null;
        if (req) {
          logError(error, req);
        }
        throw error;
      }
    };
  }
}
