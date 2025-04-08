import dotenv from 'dotenv';
dotenv.config();

import express, { Application } from 'express';
import https from 'https';
import { serverConfig } from './config/serverConfig';
import { connectDB } from './config/database';
import { globalMiddleware } from './middleware/globalMiddleware';
import { globalLimiter, apiLimiter } from './middleware/rateLimiter';
import routes from './routes';
import { attachToServer } from './services/admin/websocketService';
import passport from 'passport';
import { passportStrategy } from './config/passport';
import { globalErrorHandler } from './middleware/errorHandler';


process.on('uncaughtException', (err) => {
  console.error('[에러] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[에러] Unhandled Rejection:', reason);
});

const app : Application = express();

passportStrategy(passport);
app.set('trust proxy', true);
connectDB();

// 미들웨어 설정
globalMiddleware(app);
app.use(globalLimiter);
app.use(passport.initialize());

// 라우트 설정
app.use(['/auth', '/email'], apiLimiter);
app.use(routes);
app.head('/', (_req, res) => {
  res.status(200).end();
});
app.get('/', (_req, res) => {
  res.send('서버 실행중');
});

app.use(globalErrorHandler);

// 서버 실행
const server = serverConfig.httpsOptions
    ? https.createServer(serverConfig.httpsOptions, app).listen(serverConfig.port, () => {
      console.log(`HTTPS 서버가 포트 ${serverConfig.port}에서 실행 중입니다.`);
    })
    : app.listen(serverConfig.port, () => {
      console.log(`HTTP 서버가 포트 ${serverConfig.port}에서 실행 중입니다.`);
    });

attachToServer(server);
