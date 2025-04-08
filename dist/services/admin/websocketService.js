"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wss = exports.attachToServer = void 0;
const ws_1 = __importDefault(require("ws"));
const statusService_1 = require("./statusService");
const os_1 = __importDefault(require("os"));
const wss = new ws_1.default.Server({ noServer: true });
exports.wss = wss;
const MAX_MESSAGE_SIZE = 1024 * 100;
const connectionAttempts = new Map();
let refreshInterval = 5000;
let intervalId;
wss.on("connection", async (ws, req) => {
    console.log('클라이언트 연결됨');
    ws.isAlive = true;
    const ip = req.headers['cf-connecting-ip'] || req.socket.remoteAddress;
    const now = Date.now();
    const attempts = connectionAttempts.get(ip) || [];
    const recentAttempts = attempts.filter((timestamp) => now - timestamp < 60 * 1000);
    recentAttempts.push(now);
    connectionAttempts.set(ip, recentAttempts);
    if (recentAttempts.length > 5) {
        console.log(` WebSocket 연결 차단: ${ip} - 너무 많은 연결 시도`);
        ws.close();
        return;
    }
    ws.on('pong', () => ws.isAlive = true);
    setInterval(() => {
        if (!ws.isAlive)
            ws.terminate();
        ws.isAlive = false;
        ws.ping();
    }, 30000);
    // 첫 연결에 한해서 바로 전송
    const initialStatus = {
        ...(await (0, statusService_1.getStatus)()),
        cpuCount: os_1.default.cpus().length,
        cpuModel: os_1.default.cpus()[0].model,
        cpuSpeed: os_1.default.cpus()[0].speed
    }; // 정적인 데이터는 갱신데이터에서 제외하고 처음에만 추가로 전송
    ws.send(JSON.stringify(initialStatus));
    ws.on("message", (message) => {
        if (message.length > MAX_MESSAGE_SIZE)
            ws.close();
        try {
            const data = JSON.parse(message);
            if (data.type === "setInterval" && typeof data.interval === "number") {
                refreshInterval = data.interval * 1000;
                clearInterval(intervalId);
                startInterval();
            }
        }
        catch {
            ws.close();
        }
    });
    ws.on('close', () => console.log('클라이언트 연결 종료'));
});
const startInterval = () => {
    intervalId = setInterval(async () => {
        const status = await (0, statusService_1.getStatus)();
        wss.clients.forEach((client) => {
            if (client.readyState === ws_1.default.OPEN)
                client.send(JSON.stringify(status));
        });
    }, refreshInterval);
};
startInterval();
const attachToServer = (server) => {
    server.on('upgrade', (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });
};
exports.attachToServer = attachToServer;
