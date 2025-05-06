import { createDecorator } from '@toss/nestjs-aop';

import { LOG_EXECUTION_TIME } from '../symbols';

export const LogExecutionTime = (): MethodDecorator => createDecorator(LOG_EXECUTION_TIME);
