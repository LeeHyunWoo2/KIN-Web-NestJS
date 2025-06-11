import { TokenService } from '@/auth/token.service';
import { AccessTokenPayload } from '@/auth/types/auth-service.types';

export const generateTokenCookies = async (
  tokenService: TokenService,
  payload: AccessTokenPayload,
): Promise<string[]> => {
  const { accessToken, refreshToken } = await tokenService.generateTokens(payload, 3600);

  return [`accessToken=${accessToken}`, `refreshToken=${refreshToken}`];
};
