import { Module } from '@nestjs/common';
import { AopModule } from '@toss/nestjs-aop';

import { LogExecutionTimeHandler } from '../handlers/log-execution-time.handler';

@Module({
  imports: [AopModule],
  providers: [LogExecutionTimeHandler],
  exports: [],
})
export class CommonAopModule {}
