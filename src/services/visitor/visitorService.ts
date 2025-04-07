import Visitor from "../../models/visitor";
import {VisitorInfoInput, VisitorTrackInput, VisitorTypes} from "@/types/Visitor";

export const getVisitorList = async (): Promise<VisitorTypes[]> => Visitor.find()
  .sort({ lastVisit: -1 })
  .select("-__v")
  .lean<VisitorTypes[]>();

export const recordVisitorInfo = async ({
    visitorId, ip, country, device, browser, userAgent, referrer, path
}: VisitorInfoInput): Promise<void> => {
  const existingVisitor = await Visitor.findOne({ visitorId });

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

  const visitor = new Visitor({
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

export const trackVisitorActivity = async ({
  visitorId, stayDuration, trackUrl, visitedAt
}: VisitorTrackInput): Promise<void> => {
  const visitor = await Visitor.findOne({ visitorId });
  if (!visitor) return;

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