import 'fastify';

import { DecodedUser } from '@/types/user.types';

declare module 'fastify' {
  interface FastifyRequest {
    cookies: {
      accessToken?: string;
      refreshToken?: string;
    };
    user?: DecodedUser;
  }
}
