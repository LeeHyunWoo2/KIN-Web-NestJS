import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { EmailService } from '@/auth/email.service';
import { TokenService } from '@/auth/token.service';

import { createMockConfigService, MockConfigService, MockConfigType } from './config.mock';

interface SetupEmailServiceOptions {
  config?: MockConfigType;
  tokenService?: Partial<TokenService>;
}

export const setupEmailServiceTest = async (
  overrides: SetupEmailServiceOptions = {},
): Promise<{
  emailService: EmailService;
  config: MockConfigService;
  tokenService: TokenService;
}> => {
  const defaultConfig = {
    'app.frontendOrigin': 'http://localhost:3000',
    'mail.user': 'no-reply@localhost',
    'mail.password': 'password',
  };

  const config = createMockConfigService({
    ...defaultConfig,
    ...(overrides.config || {}),
  });

  const tokenService = {
    generateEmailVerificationToken: jest.fn().mockReturnValue('email-token'),
    ...overrides.tokenService,
  } as unknown as TokenService;

  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      EmailService,
      { provide: ConfigService, useValue: config },
      { provide: TokenService, useValue: tokenService },
    ],
  }).compile();

  return {
    emailService: moduleRef.get(EmailService),
    config,
    tokenService,
  };
};
