"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverConfig = void 0;
const fs_1 = __importDefault(require("fs"));
const isProduction = process.env.NODE_ENV === 'production';
exports.serverConfig = {
    port: Number(process.env.PORT) || 5000,
    httpsOptions: isProduction
        ? {
            key: fs_1.default.readFileSync(process.env.SSL_KEY_PATH || ""),
            cert: fs_1.default.readFileSync(process.env.SSL_CERT_PATH || ""),
        }
        : null,
};
