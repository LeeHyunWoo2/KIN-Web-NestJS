import { registerAs } from '@nestjs/config';
import fs from 'fs';

export const securityConfig = registerAs('security', () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
    backupDirectory: process.env.BACKUP_DIRECTORY,

    httpsOptions: isProduction
      ? {
          key: fs.readFileSync(process.env.SSL_KEY_PATH || ''),
          cert: fs.readFileSync(process.env.SSL_CERT_PATH || ''),
        }
      : null,
  };
});
