import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  jwtExpiration: parseInt(<string>process.env.ACCESS_TOKEN_TTL, 10),
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  refreshTokenTtl: parseInt(<string>process.env.REFRESH_TOKEN_TTL, 10),
  refreshTokenRenewThreshold: parseInt(<string>process.env.REFRESH_TOKEN_RENEW_THRESHOLD, 10),
  rememberRefreshTokenTtl: parseInt(<string>process.env.REMEMBER_REFRESH_TOKEN_TTL, 10),
  rememberRefreshTokenRenewThreshold: parseInt(
    <string>process.env.REMEMBER_REFRESH_TOKEN_RENEW_THRESHOLD,
    10,
  ),
}));
