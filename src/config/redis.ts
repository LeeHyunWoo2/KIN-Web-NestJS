import Redis from 'ioredis';

// Redis 초기화
const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT, 10),
  password: process.env.REDIS_PASSWORD,
  db: 0,
});

let isConnected = false;

redisClient.on('connect', () => {
  isConnected = true;
  console.log('Redis 연결 성공');
});

redisClient.on('error', (err) => {
  isConnected = false;
  console.error('Redis 연결 실패:', err.message);
});

export { redisClient, isConnected };