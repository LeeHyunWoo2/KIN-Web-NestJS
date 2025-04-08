"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRealIp = void 0;
const setRealIp = (req, _res, next) => {
    const cfIp = req.headers['cf-connecting-ip'];
    req.realIp = typeof cfIp === 'string' ? cfIp : req.ip;
    next();
};
exports.setRealIp = setRealIp;
