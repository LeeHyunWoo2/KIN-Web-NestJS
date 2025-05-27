/* eslint-disable */
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Aspect, LazyDecorator, WrapParams } from '@toss/nestjs-aop';
import { Logger } from 'nestjs-pino';

import { LOG_EXECUTION_TIME } from '../symbols';

@Injectable()
@Aspect(LOG_EXECUTION_TIME)
export class LogExecutionTimeHandler implements LazyDecorator {
  constructor(@Inject(Logger) private readonly logger: LoggerService) {}

  wrap({ method, methodName, instance }: WrapParams): (...args: any[]) => any {
    return async (...args: any[]) => {
      const start = Date.now();
      const result = await method(...args);
      const end = Date.now();
      const className = instance?.constructor?.name ?? 'UnknownClass';

      this.logger.log({
        type: 'AOP_EXECUTION_TIME_HANDLER',
        action: 'ExecutionTime',
        className,
        methodName,
        durationMs: end - start,
      });

      return result;
    };
  }
}
