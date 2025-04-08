export interface VisitorTypes {
  visitorId: string;
  visitCount: number;
  lastVisit: Date;
  ipHistory: {
    ip: string;
    changedAt: Date;
  }[];
  device?: string;
  country: string;
  browser?: string;
  userAgent?: string;
  tracking: {
    path: string;
    stay: number;
    visitedAt: Date;
  }[];
  path?: string;
  referrer?: string;
  createdAt: Date;
}

export interface VisitorInfoInput {
  visitorId: string;
  ip: string;
  country: string;
  device: string;
  browser: string;
  userAgent: string;
  referrer: string;
  path: string;
}


export interface VisitorTrackInput {
  visitorId: string;
  trackUrl: string;
  stayDuration: number;
  visitedAt: Date;
}