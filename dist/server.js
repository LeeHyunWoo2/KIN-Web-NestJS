"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const https_1 = __importDefault(require("https"));
const serverConfig_1 = require("./config/serverConfig");
const database_1 = require("./config/database");
const globalMiddleware_1 = require("./middleware/globalMiddleware");
const rateLimiter_1 = require("./middleware/rateLimiter");
const routes_1 = __importDefault(require("./routes"));
const websocketService_1 = require("./services/admin/websocketService");
const passport_1 = __importDefault(require("passport"));
const passport_2 = require("./config/passport");
process.on('uncaughtException', (err) => {
    console.error('[에러] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
    console.error('[에러] Unhandled Rejection:', reason);
});
const app = (0, express_1.default)();
(0, passport_2.passportStrategy)(passport_1.default);
app.set('trust proxy', true);
(0, database_1.connectDB)();
// 미들웨어 설정
(0, globalMiddleware_1.globalMiddleware)(app);
app.use(rateLimiter_1.globalLimiter);
app.use(passport_1.default.initialize());
// 라우트 설정
app.use(['/auth', '/email'], rateLimiter_1.apiLimiter);
app.use(routes_1.default);
app.head('/', (_req, res) => {
    res.status(200).end();
});
app.get('/', (_req, res) => {
    res.send('서버 실행중');
});
// 서버 실행
const server = serverConfig_1.serverConfig.httpsOptions
    ? https_1.default.createServer(serverConfig_1.serverConfig.httpsOptions, app).listen(serverConfig_1.serverConfig.port, () => {
        console.log(`HTTPS 서버가 포트 ${serverConfig_1.serverConfig.port}에서 실행 중입니다.`);
    })
    : app.listen(serverConfig_1.serverConfig.port, () => {
        console.log(`HTTP 서버가 포트 ${serverConfig_1.serverConfig.port}에서 실행 중입니다.`);
    });
(0, websocketService_1.attachToServer)(server);
