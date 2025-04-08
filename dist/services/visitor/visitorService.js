"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackVisitorActivity = exports.recordVisitorInfo = exports.getVisitorList = void 0;
const visitor_1 = __importDefault(require("../../models/visitor"));
const getVisitorList = async () => visitor_1.default.find()
    .sort({ lastVisit: -1 })
    .select("-__v")
    .lean();
exports.getVisitorList = getVisitorList;
const recordVisitorInfo = async ({ visitorId, ip, country, device, browser, userAgent, referrer, path }) => {
    const existingVisitor = await visitor_1.default.findOne({ visitorId });
    if (existingVisitor) {
        existingVisitor.visitCount += 1;
        existingVisitor.lastVisit = new Date();
        const lastIpEntry = existingVisitor.ipHistory[existingVisitor.ipHistory.length - 1];
        if (!lastIpEntry || lastIpEntry.ip !== ip) {
            existingVisitor.ipHistory.push({ ip, changedAt: new Date() });
        }
        await existingVisitor.save();
        return;
    }
    const visitor = new visitor_1.default({
        visitorId,
        ipHistory: [{ ip, changedAt: new Date() }],
        country,
        device,
        browser,
        userAgent,
        referrer,
        path,
        visitCount: 1,
        lastVisit: new Date(),
        createdAt: new Date(),
    });
    await visitor.save();
    return;
};
exports.recordVisitorInfo = recordVisitorInfo;
const trackVisitorActivity = async ({ visitorId, stayDuration, trackUrl, visitedAt }) => {
    const visitor = await visitor_1.default.findOne({ visitorId });
    if (!visitor)
        return;
    visitor.tracking = visitor.tracking || [];
    visitor.tracking.push({
        path: trackUrl,
        stay: stayDuration,
        visitedAt: visitedAt ? new Date(visitedAt) : new Date(),
    });
    if (visitor.tracking.length > 100) {
        visitor.tracking.shift();
    }
    await visitor.save();
};
exports.trackVisitorActivity = trackVisitorActivity;
