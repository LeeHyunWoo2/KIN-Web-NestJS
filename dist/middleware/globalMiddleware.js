"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalMiddleware = void 0;
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const xssSanitizer_1 = require("./xssSanitizer");
const hpp_1 = __importDefault(require("hpp"));
const logger_1 = require("./logger");
const setRealIp_1 = require("@/middleware/setRealIp");
const originWhitelist = [
    process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
];
const globalMiddleware = (app) => {
    app.use(logger_1.logger);
    app.use((0, compression_1.default)());
    app.use(express_1.default.json());
    app.use((0, cookie_parser_1.default)());
    app.use(body_parser_1.default.json());
    app.use(setRealIp_1.setRealIp);
    app.use((0, cors_1.default)({
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
    }));
    app.options('*', (0, cors_1.default)());
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false,
        hsts: {
            maxAge: 60 * 60 * 24 * 365,
            includeSubDomains: true,
        },
    }));
    app.use((0, express_mongo_sanitize_1.default)());
    app.use(xssSanitizer_1.xssSanitizer);
    app.use((0, hpp_1.default)());
};
exports.globalMiddleware = globalMiddleware;
