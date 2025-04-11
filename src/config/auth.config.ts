import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  jwtExpiration: parseInt(process.env.ACCESS_TOKEN_TTL || '3600', 10),
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  refreshTokenTtl: parseInt(process.env.REFRESH_TOKEN_TTL || '604800', 10),
  refreshTokenRenewThreshold: parseInt(process.env.REFRESH_TOKEN_RENEW_THRESHOLD || '10800', 10),
  rememberRefreshTokenTtl: parseInt(process.env.REMEMBER_REFRESH_TOKEN_TTL || '2592000', 10),
  rememberRefreshTokenRenewThreshold: parseInt(
    process.env.REMEMBER_REFRESH_TOKEN_RENEW_THRESHOLD || '259200',
    10,
  ),
}));
