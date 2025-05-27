import { Test, TestingModule } from '@nestjs/testing';

import { RequestEmailTokenDto, VerifyEmailTokenResponseDto } from '@/auth/dto/email-token.dto';
import { EmailController } from '@/auth/email.controller';
import { EmailService } from '@/auth/email.service';
import { TokenService } from '@/auth/token.service';
import { SendVerificationEmailInput } from '@/auth/types/auth-service.types';

describe('EmailController', () => {
  let controller: EmailController;
  let emailService: jest.Mocked<EmailService>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [
        { provide: EmailService, useValue: { sendVerificationEmail: jest.fn() } },
        { provide: TokenService, useValue: { verifyEmailVerificationToken: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(EmailController);
    emailService = moduleRef.get(EmailService);
    tokenService = moduleRef.get(TokenService);
  });

  describe('sendVerificationEmail', () => {
    it('sendVerificationEmail을 호출하고 응답을 반환해야 합니다', async () => {
      const dto: RequestEmailTokenDto = { email: 'test@test.com' };
      const input: SendVerificationEmailInput = { email: dto.email };

      const result = await controller.sendVerificationEmail(dto);

      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(input);
      expect(result).toEqual({ message: '이메일 인증 링크가 전송되었습니다.' });
    });
  });

  describe('verifyEmailToken', () => {
    it('verifyEmailVerificationToken을 호출하고 응답을 반환해야 합니다', async () => {
      const token = 'test-token';
      const expectedEmail = { email: 'test@test.com' };
      const expected: VerifyEmailTokenResponseDto = {
        message: '이메일 인증이 완료되었습니다.',
        email: expectedEmail,
      };

      tokenService.verifyEmailVerificationToken.mockResolvedValue(expectedEmail);

      const result = await controller.verifyEmailToken(token);

      expect(tokenService.verifyEmailVerificationToken).toHaveBeenCalledWith(token);
      expect(result).toEqual(expected);
    });
  });
});
