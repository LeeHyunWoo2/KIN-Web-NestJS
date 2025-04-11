import { ConfigService } from '@nestjs/config';

let configService: ConfigService;

export const globalConfigService = (config: ConfigService): void => {
  configService = config;
};

export const getConfig = (): ConfigService => configService;
