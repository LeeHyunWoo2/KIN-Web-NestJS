import { Logger } from '@nestjs/common';
import { Aspect, LazyDecorator, WrapParams } from '@toss/nestjs-aop';

import { LOG_EXECUTION_TIME } from '../symbols/log-execution-time.symbol';

@Aspect(LOG_EXECUTION_TIME)
export class LogExecutionTimeHandler implements LazyDecorator {
  wrap({ method, methodName, instance }: WrapParams): (...args: any[]) => any {
    return async (...args: any[]) => {
      const start = Date.now();
      const result = await method(...args);
      const end = Date.now();
      const className = instance?.constructor?.name ?? 'UnknownClass';
      Logger.log(`${className}.${methodName} took ${end - start}ms`, 'ExecutionTime');
      return result;
    };
  }
}
