import {
  getVisitorList,
  recordVisitorInfo,
  trackVisitorActivity
} from "@/services/visitor/visitorService";
import {sendFormattedError} from "@/utils/sendFormattedError";
import {CustomError} from "@/types/CustomError";
import {Request, Response} from "express";
import {
  RecordVisitorInfoRequestDto,
  TrackVisitorActivityRequestDto
} from "@/types/dto/visitor/visitor.request.dto";
import {VisitorInfoInput} from "@/types/Visitor";
import {VisitorSummaryResponse} from "@/types/dto/visitor/visitor.response.dto";
import {logError} from "@/utils/logError";

const getHeaderString = (value: string | string[] | undefined, fallback = "unknown"): string =>
    Array.isArray(value) ? value[0] : value ?? fallback;

// 관리자용
export const getVisitorListController = async (
    _req: Request,
    res: Response<VisitorSummaryResponse[]>,
): Promise<void> => {
  try {
    const visitorList = await getVisitorList()
    res.status(200).json(visitorList);
  } catch (error) {
    sendFormattedError(res, error as CustomError, "방문자 기록 로드 중 오류 발생", {skipToast: true});
  }
}

export const recordVisitorInfoController = async (
    req: Request<{}, {}, RecordVisitorInfoRequestDto>,
    res: Response,
): Promise<void> => {
  try {
    const {visitorId, path} = req.body;
    const input: VisitorInfoInput = {
      visitorId,
      path,
      ip: getHeaderString(req.headers["cf-connecting-ip"], "localhost"),
      country: getHeaderString(req.headers["cf-ipcountry"]),
      device: getHeaderString(req.headers["sec-ch-ua-platform"]),
      browser: getHeaderString(req.headers["sec-ch-ua"]),
      userAgent: getHeaderString(req.headers["user-agent"]),
      referrer: getHeaderString(req.headers["referer"], "direct"),
    };
    await recordVisitorInfo(input);
    res.status(201).end();
  } catch (error) {
    logError(error, req);
    sendFormattedError(res, error as CustomError, "방문자 기록 저장 중 오류 발생", {skipToast: true});
  }
};

export const trackVisitorActivityController = async (
    req: Request<{}, {}, TrackVisitorActivityRequestDto>,
    res: Response,
): Promise<void> => {
  try {
    const { visitorId, stayDuration, trackUrl, visitedAt } = req.body;
    await trackVisitorActivity({
      visitorId,
      stayDuration,
      trackUrl,
      visitedAt: new Date(visitedAt),
    });
    res.status(200).end();
  } catch (error) {
    logError(error, req);
    sendFormattedError(res, error as CustomError, "트래킹 데이터 저장 중 오류 발생", {skipToast: true});
  }
};