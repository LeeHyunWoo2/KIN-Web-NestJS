"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.xssSanitizer = void 0;
const xss_1 = __importDefault(require("xss"));
const xssSanitizer = (req, _res, next) => {
    ['body', 'query', 'params'].forEach((key) => {
        if (req[key]) {
            for (const prop in req[key]) {
                if (typeof req[key][prop] === 'string') {
                    req[key][prop] = (0, xss_1.default)(req[key][prop]);
                }
            }
        }
    });
    next();
};
exports.xssSanitizer = xssSanitizer;
