import express, { Application } from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import { xssSanitizer} from "./xssSanitizer";
import hpp from 'hpp';
import { logger } from "./logger";
import {setRealIp} from "@/middleware/setRealIp";

const originWhitelist = [
  process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
];

export const globalMiddleware = (app : Application) : void => {
  app.use(setRealIp);
  app.use(logger);
  app.use(compression());
  app.use(express.json());
  app.use(cookieParser());
  app.use(bodyParser.json());

  app.use(
      cors({
        origin: originWhitelist,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'Cache-Control',
          'Accept',
          'Origin',
          'Referer',
          'User-Agent',
          'X-CSRF-Token',
          'X-Requested-With',
          'cf-connecting-ip',
          'cf-clearance',
          'x-skip-interceptor',
          'x-api-key'
        ],
        credentials: true,
      })
  );
  app.options('*', cors());

  app.use(
      helmet({
        contentSecurityPolicy: false,
        hsts: {
          maxAge: 60 * 60 * 24 * 365,
          includeSubDomains: true,
        },
      })
  );
  app.use(mongoSanitize());
  app.use(xssSanitizer);
  app.use(hpp());
};