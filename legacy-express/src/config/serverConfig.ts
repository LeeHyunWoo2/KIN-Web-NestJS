import fs from 'fs';

const isProduction = process.env.NODE_ENV === 'production';

export const serverConfig = {
  port: Number(process.env.PORT) || 5000,
  httpsOptions: isProduction
      ? {
        key: fs.readFileSync(process.env.SSL_KEY_PATH || ""),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH || ""),
      }
      : null,
};