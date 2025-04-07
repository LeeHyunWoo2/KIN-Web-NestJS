// 방문자 최초 기록용
export interface RecordVisitorInfoRequestDto {
  visitorId: string;
  ip: string;
  country: string;
  device: string;
  browser: string;
  userAgent: string;
  referrer: string;
  path: string;
}

// 행동 추적용
export interface TrackVisitorActivityRequestDto {
  visitorId: string;
  stayDuration: number;
  trackUrl: string;
  visitedAt: string;
}
