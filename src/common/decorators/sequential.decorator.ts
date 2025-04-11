import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const SEQUENTIAL_KEY = 'sequential';
export const Sequential = (): CustomDecorator => SetMetadata(SEQUENTIAL_KEY, true);
