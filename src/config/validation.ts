// TODO 모듈 undefined 오류 해결해야 함
import Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  PORT: Joi.number().default(5000),
  FRONTEND_ORIGIN: Joi.string().uri().required(),

  ACCESS_TOKEN_SECRET: Joi.string().required(),
  ACCESS_TOKEN_TTL: Joi.number().required(),

  REFRESH_TOKEN_SECRET: Joi.string().required(),
  REFRESH_TOKEN_TTL: Joi.number().required(),
  REMEMBER_REFRESH_TOKEN_TTL: Joi.number().required(),

  REFRESH_TOKEN_RENEW_THRESHOLD: Joi.number().required(),
  REMEMBER_REFRESH_TOKEN_RENEW_THRESHOLD: Joi.number().required(),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
  REDIS_PASSWORD: Joi.string().required(),

  MONGO_URI: Joi.string().uri().required(),

  TURNSTILE_SECRET_KEY: Joi.string().required(),

  SSL_KEY_PATH: Joi.string().optional(),
  SSL_CERT_PATH: Joi.string().optional(),

  BACKUP_DIRECTORY: Joi.string().optional(),

  EMAIL_USER: Joi.string().email().required(),
  EMAIL_PASSWORD: Joi.string().required(),

  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().required(),
  GOOGLE_LINK_CALLBACK_URL: Joi.string().uri().required(),

  KAKAO_CLIENT_ID: Joi.string().required(),
  KAKAO_CLIENT_SECRET: Joi.string().required(),
  KAKAO_CALLBACK_URL: Joi.string().uri().required(),
  KAKAO_LINK_CALLBACK_URL: Joi.string().uri().required(),

  NAVER_CLIENT_ID: Joi.string().required(),
  NAVER_CLIENT_SECRET: Joi.string().required(),
  NAVER_CALLBACK_URL: Joi.string().uri().required(),
  NAVER_LINK_CALLBACK_URL: Joi.string().uri().required(),

  SOCIAL_LINK_REDIRECT_URL: Joi.string().required(),

  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_POR: Joi.number().required(),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().required(),
});
