"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isConnected = exports.redisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
// Redis 초기화
const redisClient = new ioredis_1.default({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
    password: process.env.REDIS_PASSWORD,
    db: 0,
});
exports.redisClient = redisClient;
let isConnected = false;
exports.isConnected = isConnected;
redisClient.on('connect', () => {
    exports.isConnected = isConnected = true;
    console.log('Redis 연결 성공');
});
redisClient.on('error', (err) => {
    exports.isConnected = isConnected = false;
    console.error('Redis 연결 실패:', err.message);
});
