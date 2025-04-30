import { Controller, Get } from '@nestjs/common';

import { CatchAndLog } from '@/common/decorators/catch-and-log.decorator';
import { LogExecutionTime } from '@/common/decorators/log-execution-time.decorator';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @CatchAndLog()
  @Get('test-error')
  testError(): void {
    throw new Error('테스트용 의도적인 에러');
  }

  @LogExecutionTime()
  @CatchAndLog()
  @Get('test-success')
  testSuccess(): string {
    return this.appService.getTest();
  }
}
