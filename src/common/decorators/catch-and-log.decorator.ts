import { createDecorator } from '@toss/nestjs-aop';

import { CATCH_AND_LOG } from '../symbols/catch-and-log.symbol';

export const CatchAndLog = (): MethodDecorator => createDecorator(CATCH_AND_LOG);
