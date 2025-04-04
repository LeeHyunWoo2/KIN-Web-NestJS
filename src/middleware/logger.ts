import morgan from 'morgan';
import { Request } from 'express';

// 현재 시간 토큰 추가 (포맷팅 최적화)
morgan.token('time', () => {
  const now = new Date();
  const date = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
  const time = now.toLocaleTimeString('en-GB', { hour12: false }); // HH:mm:ss
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  return `${date} / ${time}.${ms}`;
});

// Body의 특정 필드 제외
morgan.token('body', (req : Request) => {
  const body = req.body || {};
  const sanitizedBody = {...body};

  delete sanitizedBody.password;
  delete sanitizedBody.turnstileToken;

  if (req.method === 'PUT' && req.originalUrl.split('?')[0] === '/notes') {
    const { updateDataList } = sanitizedBody;

    if (Array.isArray(updateDataList)) {
      sanitizedBody.updateDataList = updateDataList.map((item) => {
        const { content, id, ...rest } = item; // content 및 id 필드 제외
        return rest;
      });
    }
  }
  return JSON.stringify(sanitizedBody, null, 2);
});

morgan.token('query', (req : Request) => JSON.stringify(req.query || {}));
morgan.token('errorMessage', (_req, res) => res.statusCode >= 400 ? `Error: ${res.statusMessage || 'Unknown error'}` : '');

const logFormat = ':time / :method :url [:status] query: :query body: :body :errorMessage';

const skipLog = (req : Request) => {
  const excludedPaths = ['/categories', '/tags', '/server-time', '/sync', '/auth/session'];
  const fullPath = req.originalUrl.split('?')[0];
  // 특정 경로 로깅 제외
  return (req.method === 'GET' || req.method === 'OPTIONS') && excludedPaths.includes(fullPath)|| (req.method === 'POST' && fullPath === '/notes');
};

const logger = morgan(logFormat, { skip: skipLog });

export default logger;