import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Aspect, LazyDecorator, WrapParams } from '@toss/nestjs-aop';
import { Logger } from 'nestjs-pino';

import { CATCH_AND_LOG } from '../symbols/catch-and-log.symbol';
import { LoggableError } from '../types/loggable-error';

@Injectable()
@Aspect(CATCH_AND_LOG)
export class CatchAndLogHandler implements LazyDecorator {
  constructor(@Inject(Logger) private readonly logger: LoggerService) {}

  wrap({ method }: WrapParams): (...args: any[]) => any {
    return async (...args: any[]) => {
      try {
        return await method(...args);
      } catch (error) {
        const err = error as LoggableError;

        this.logger.error({
          type: 'AOP_LOG_HANDLER',
          message: err.message,
          stack: err.stack,
        });

        err.__alreadyLogged = true;
        throw err;
      }
    };
  }
}
