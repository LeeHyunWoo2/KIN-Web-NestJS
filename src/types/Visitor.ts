export interface VisitorTypes {
  visitorId: string;
  ipHistory: {
    ip: string;
    changedAt: Date;
  }[];
  country: string;
  userAgent?: string;
  referrer?: string;
  path?: string;
  tracking: {
    path: string;
    stay: number;
    visitedAt: Date;
  }[];
  device?: string;
  browser?: string;
  visitCount: number;
  lastVisit: Date;
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