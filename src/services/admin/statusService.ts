import mongoose from 'mongoose';
import { isConnected } from '@/config/redis';
import os from 'os';

// 백엔드 서버 상태 대시보드 (관리자용)
export const getStatus = async () => {
  const mongodbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  const redisStatus = isConnected ? 'Connected' : 'Disconnected';
  const now = new Date();
  const serverDate = now.toLocaleDateString("ko-KR");
  const serverTime = now.toLocaleTimeString("en-GB");

  return {
    mongodb: mongodbStatus,
    redis: redisStatus,
    uptime: os.uptime(),
    nodeUptime: process.uptime(), // Node.js 가 실행된 총 시간 (초)
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    cpuUsagePerCore: os.cpus().map(cpu => cpu.times.user), // 각 CPU 코어가 로직에 사용된 시간
    cpuTotalUsage: os.totalmem(), // 시스템 총 메모리 크기 (바이트)
    cpuFreeMemory: os.freemem(), // 여유 메모리 크기 (바이트)
    loadAverage: os.loadavg(), // 1, 5, 15분 평균 부하
    serverTime: `${serverDate} - ${serverTime}`, // 서버 시간 (날짜 - 시간)
  };
};