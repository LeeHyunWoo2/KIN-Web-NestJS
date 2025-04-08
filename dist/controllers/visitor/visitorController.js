"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackVisitorActivityController = exports.recordVisitorInfoController = exports.getVisitorListController = void 0;
const visitorService_1 = require("@/services/visitor/visitorService");
const sendFormattedError_1 = require("@/utils/sendFormattedError");
const getHeaderString = (value, fallback = "unknown") => Array.isArray(value) ? value[0] : value ?? fallback;
// 관리자용
const getVisitorListController = async (_req, res) => {
    try {
        const visitorList = await (0, visitorService_1.getVisitorList)();
        res.status(200).json(visitorList);
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "방문자 기록 로드 중 오류 발생", { skipToast: true });
    }
};
exports.getVisitorListController = getVisitorListController;
const recordVisitorInfoController = async (req, res) => {
    try {
        const { visitorId, path } = req.body;
        const input = {
            visitorId,
            path,
            ip: getHeaderString(req.headers["cf-connecting-ip"], "localhost"),
            country: getHeaderString(req.headers["cf-ipcountry"]),
            device: getHeaderString(req.headers["sec-ch-ua-platform"]),
            browser: getHeaderString(req.headers["sec-ch-ua"]),
            userAgent: getHeaderString(req.headers["user-agent"]),
            referrer: getHeaderString(req.headers["referer"], "direct"),
        };
        await (0, visitorService_1.recordVisitorInfo)(input);
        res.status(201).end();
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "방문자 기록 저장 중 오류 발생", { skipToast: true });
    }
};
exports.recordVisitorInfoController = recordVisitorInfoController;
const trackVisitorActivityController = async (req, res) => {
    try {
        const { visitorId, stayDuration, trackUrl, visitedAt } = req.body;
        await (0, visitorService_1.trackVisitorActivity)({
            visitorId,
            stayDuration,
            trackUrl,
            visitedAt: new Date(visitedAt),
        });
        res.status(200).end();
    }
    catch (error) {
        (0, sendFormattedError_1.sendFormattedError)(res, error, "트래킹 데이터 저장 중 오류 발생", { skipToast: true });
    }
};
exports.trackVisitorActivityController = trackVisitorActivityController;
