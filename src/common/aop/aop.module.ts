import { Module } from '@nestjs/common';
import { AopModule } from '@toss/nestjs-aop';

import { CatchAndLogHandler } from '../handlers/catch-and-log.handler';
import { LogExecutionTimeHandler } from '../handlers/log-execution-time.handler';

@Module({
  imports: [AopModule],
  providers: [CatchAndLogHandler, LogExecutionTimeHandler],
  exports: [],
})
export class CommonAopModule {}
