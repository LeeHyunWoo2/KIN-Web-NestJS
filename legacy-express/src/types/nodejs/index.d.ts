declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: 'development' | 'production';

    PORT?: string;

    SSL_KEY_PATH?: string;
    SSL_CERT_PATH?: string;

    JWT_SECRET: string;
    REFRESH_TOKEN_SECRET: string;
    JWT_EXPIRATION: string;
    REFRESH_EXPIRATION: string;
    REMEMBER_REFRESH_EXPIRATION: string;
    RENEW_REFRESH_TTL_LIMIT: string;
    REMEMBER_RENEW_REFRESH_TTL_LIMIT: string;

    REDIS_HOST: string;
    REDIS_PORT: string;
    REDIS_PASSWORD: string;

    FRONTEND_ORIGIN : string;
  }
}