import visitorService from "../../services/visitor/visitorService";
import { createErrorResponse } from "../../utils/formatErrorResponse";

// 관리자용
export const getVisitorListController = async (req, res) => {
  try {
    const visitorList = await visitorService.getVisitorList()
    res.status(200).json(visitorList);
  } catch (error) {
    console.log(error)
    const {statusCode, message} = createErrorResponse(error.status || 500,
        error.message || "방문자 기록 로드 중 오류 발생");
    res.status(statusCode).json({message, skipToast: true});
  }
}

export const recordVisitorInfoController = async (req, res) => {
  try {
    const {visitorId, path} = req.body;
    const ip = req.headers["cf-connecting-ip"] || "localhost";
    const country = req.headers["cf-ipcountry"] || "unknown";
    const device = req.headers["sec-ch-ua-platform"] || "unknown";
    const browser = req.headers["sec-ch-ua"] || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";
    const referrer = req.headers["referer"] || "direct";

    await visitorService.recordVisitorInfo({visitorId, ip, country, device, browser, userAgent, referrer, path});
    res.status(201).end();
  } catch (error) {
    const {statusCode, message} = createErrorResponse(error.status || 500,
        error.message || "방문자 기록 저장 중 오류 발생");
    res.status(statusCode).json({message, skipToast: true});
  }
};

export const trackVisitorActivityController = async (req, res) => {
  try {
    const { visitorId, stayDuration, trackUrl, visitedAt } = req.body;
    await visitorService.trackVisitorActivity({
      visitorId,
      stayDuration,
      trackUrl,
      visitedAt,
    });
    res.status(200).end();
  } catch (error) {
    const { statusCode, message } = createErrorResponse(
        error.status || 500,
        error.message || "트래킹 데이터 저장 중 오류 발생"
    );
    res.status(statusCode).json({ message, skipToast: true });
  }
};