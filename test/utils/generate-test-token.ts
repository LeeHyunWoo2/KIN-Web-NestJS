import { INestApplication } from '@nestjs/common';

import { TokenService } from '@/../src/auth/token.service';
import { AccessTokenPayload } from '@/auth/types/auth-service.types';

export const generateTestAccessToken = async (
  app: INestApplication,
  payload: AccessTokenPayload,
): Promise<string> => {
  const tokenService = app.get(TokenService);

  const { accessToken } = await tokenService.generateTokens(payload, 3600);
  return accessToken;
};
