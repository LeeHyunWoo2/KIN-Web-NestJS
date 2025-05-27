import { FastifyReply } from 'fastify';

import { getConfig } from '@/config/global-config.service';

export const setCookie = (
  reply: FastifyReply,
  name: string,
  value: string,
  options: {
    maxAge?: number;
  } = {},
): void => {
  const config = getConfig();
  const isProduction = config.get<string>('app.nodeEnv') === 'production';

  reply.setCookie(name, value, {
    httpOnly: isProduction,
    secure: isProduction,
    sameSite: 'lax',
    domain: isProduction ? 'noteapp.org' : undefined,
    ...options,
  });
};
