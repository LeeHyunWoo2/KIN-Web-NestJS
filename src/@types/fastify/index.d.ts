import 'fastify';

import {
  AccessTokenPayload,
  DecodedUser,
  PassportAuthResultError,
} from '@/auth/types/auth-service.types';

declare module 'fastify' {
  interface FastifyRequest {
    cookies: {
      accessToken?: string;
      refreshToken?: string;
    };
    user?: DecodedUser;
    authResult?: {
      user?: AccessTokenPayload;
      error?: PassportAuthResultError;
    };
  }
}
