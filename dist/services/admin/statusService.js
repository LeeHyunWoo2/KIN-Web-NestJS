"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatus = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const redis_1 = require("@/config/redis");
const os_1 = __importDefault(require("os"));
// 백엔드 서버 상태 대시보드 (관리자용)
const getStatus = async () => {
    const mongodbStatus = mongoose_1.default.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    const redisStatus = redis_1.isConnected ? 'Connected' : 'Disconnected';
    const now = new Date();
    const serverDate = now.toLocaleDateString("ko-KR");
    const serverTime = now.toLocaleTimeString("en-GB");
    return {
        mongodb: mongodbStatus,
        redis: redisStatus,
        uptime: os_1.default.uptime(),
        nodeUptime: process.uptime(), // Node.js 가 실행된 총 시간 (초)
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        cpuUsagePerCore: os_1.default.cpus().map(cpu => cpu.times.user), // 각 CPU 코어가 로직에 사용된 시간
        cpuTotalUsage: os_1.default.totalmem(), // 시스템 총 메모리 크기 (바이트)
        cpuFreeMemory: os_1.default.freemem(), // 여유 메모리 크기 (바이트)
        loadAverage: os_1.default.loadavg(), // 1, 5, 15분 평균 부하
        serverTime: `${serverDate} - ${serverTime}`, // 서버 시간 (날짜 - 시간)
    };
};
exports.getStatus = getStatus;
