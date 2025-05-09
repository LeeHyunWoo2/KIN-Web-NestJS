const sendMailMock = jest.fn();
const createTransportMock = jest.fn().mockReturnValue({ sendMail: sendMailMock });
jest.mock('nodemailer', () => ({
  createTransport: createTransportMock,
}));

import { EmailSendFailedException } from '@/common/exceptions';

import { setupEmailServiceTest } from '../../test/utils/email-service.test-helper';

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
  });
});
