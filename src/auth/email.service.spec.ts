import {
  createMockConfigService,
  MockConfigService,
  MockConfigType,
} from '../../test/utils/config.mock';

const sendMailMock = jest.fn();
const createTransportMock = jest.fn().mockReturnValue({ sendMail: sendMailMock });
jest.mock('nodemailer', () => ({
  createTransport: createTransportMock,
}));

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { EmailService } from '@/auth/email.service';
import { TokenService } from '@/auth/token.service';
import { EmailSendFailedException } from '@/common/exceptions';

interface SetupEmailServiceOptions {
  config?: MockConfigType;
  tokenService?: Partial<TokenService>;
}

const setupEmailServiceTest = async (
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

describe('EmailService', () => {
  describe('sendVerificationEmail', () => {
    it('이메일을 전송해야 합니다', async () => {
      sendMailMock.mockResolvedValueOnce(undefined);

      const { emailService, config, tokenService } = await setupEmailServiceTest();

      const result = await emailService.sendVerificationEmail({ email: 'test@email.com' });

      const expectedToken = 'email-token';
      const expectedUrl = `${config.getOrThrow('app.frontendOrigin')}/verify-email?token=${expectedToken}`;

      expect(tokenService.generateEmailVerificationToken).toHaveBeenCalledWith('test@email.com');
      expect(createTransportMock).toHaveBeenCalledWith({
        service: 'Gmail',
        auth: {
          user: config.getOrThrow('mail.user') as string,
          pass: config.getOrThrow('mail.password') as string,
        },
      });

      expect(sendMailMock).toHaveBeenCalledWith({
        from: config.getOrThrow('mail.user') as string,
        to: 'test@email.com',
        subject: '이메일 인증 요청',
        text: expect.stringContaining(expectedUrl) as string,
      });

      expect(result).toBeUndefined();
    });

    it('이메일 전송에 실패하면 EmailSendFailedException을 던져야 합니다', async () => {
      sendMailMock.mockRejectedValueOnce(new Error('SMTP Error'));

      const { emailService } = await setupEmailServiceTest();

      await expect(emailService.sendVerificationEmail({ email: 'fail@email.com' })).rejects.toThrow(
        EmailSendFailedException,
      );
    });
    it('nodeEnv가 "test"일 경우 더 이상 진행되지 않아야 합니다', async () => {
      const { emailService } = await setupEmailServiceTest({
        config: {
          'app.nodeEnv': 'test',
        },
      });

      const result = await emailService.sendVerificationEmail({ email: 'test@email.com' });

      expect(createTransportMock).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });
});
