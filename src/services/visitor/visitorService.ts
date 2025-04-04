import Visitor from "../../models/visitor";

const getVisitorList = async () =>Visitor.find().sort({lastVisit: -1}).select("visitorId visitCount lastVisit ipHistory device country browser userAgent tracking path")

const recordVisitorInfo = async ({ visitorId, ip, country, device, browser, userAgent, referrer, path }) => {
  const existingVisitor = await Visitor.findOne({ visitorId });

  if (existingVisitor) {
    existingVisitor.visitCount += 1;
    existingVisitor.lastVisit = new Date();

    const lastIpEntry = existingVisitor.ipHistory[existingVisitor.ipHistory.length - 1];
    if (!lastIpEntry || lastIpEntry.ip !== ip) {
      existingVisitor.ipHistory.push({ ip, changedAt: new Date() });
    }

    await existingVisitor.save();
    return null;
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
  });

  await visitor.save();
  return null;
};

const trackVisitorActivity = async ({ visitorId, stayDuration, trackUrl, visitedAt }) => {
  const visitor = await Visitor.findOne({ visitorId });
  if (!visitor) return;

  visitor.tracking = visitor.tracking || [];

  visitor.tracking.push({
    path: trackUrl,
    stay: stayDuration,
    visitedAt: visitedAt ? new Date(visitedAt) : new Date(),
  });
  if (visitor.tracking.length > 100) visitor.tracking.shift();
  await visitor.save();
};

module.exports = { getVisitorList ,recordVisitorInfo, trackVisitorActivity };