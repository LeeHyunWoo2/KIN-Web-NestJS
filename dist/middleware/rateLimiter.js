"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLimiter = exports.globalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.globalLimiter = (0, express_rate_limit_1.default)({
    validate: { trustProxy: false },
    windowMs: 10 * 60 * 1000,
    max: 1500,
    message: "요청 횟수를 초과했습니다.",
});
exports.apiLimiter = (0, express_rate_limit_1.default)({
    validate: { trustProxy: false },
    windowMs: 3 * 60 * 1000,
    max: 100,
    message: "요청 횟수를 초과 하였습니다. 잠시 후 다시 시도해주세요.",
    keyGenerator: (req) => typeof req.headers['cf-connecting-ip'] === 'string'
        ? req.headers['cf-connecting-ip']
        : req.ip || '',
});
