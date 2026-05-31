import { Request, Response } from "express";
import { ActivityLogModel } from "../models/activity-log.model";
import { getClientIp, parseUserAgent, estimateLocation, evaluateRiskLevel } from "../utils/request-metadata";
import { sendSuccess } from "../utils/api-response";
import { AppError } from "../utils/app-error";

// Stateful in-memory tracking of revoked sessions per user
const revokedSessions = new Map<string, Set<string>>();

const getRevokedSet = (userId: string): Set<string> => {
  if (!revokedSessions.has(userId)) {
    revokedSessions.set(userId, new Set<string>());
  }
  return revokedSessions.get(userId)!;
};

export const getActivities = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  // Fetch activities from DB
  const logs = await ActivityLogModel.find({ userId }).sort({ timestamp: -1 });

  return sendSuccess(res, logs);
};

export const clearActivities = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  await ActivityLogModel.deleteMany({ userId });

  // Record log deletion event in db
  const ip = getClientIp(req);
  const parsedUa = parseUserAgent(req.headers["user-agent"]);
  const location = estimateLocation(ip);

  await ActivityLogModel.create({
    userId,
    action: "Xóa nhật ký",
    description: "Đã xóa toàn bộ lịch sử hoạt động bảo mật",
    type: "settings_change",
    timestamp: new Date(),
    ip,
    userAgent: req.headers["user-agent"] || "Mozilla/5.0",
    location,
    device: `${parsedUa.browser} / ${parsedUa.device}`,
    riskLevel: "safe",
  });

  return sendSuccess(res, { message: "Activity logs cleared successfully" });
};

export const getSessions = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  const ip = getClientIp(req);
  const parsedUa = parseUserAgent(req.headers["user-agent"]);
  const location = estimateLocation(ip);
  const revokedSet = getRevokedSet(userId);

  // Core dynamic sessions list
  const allSessions = [
    {
      id: "sess_current",
      device: parsedUa.device,
      browser: parsedUa.browser,
      ip,
      location,
      lastActive: "Current",
      isCurrent: true,
    },
  ];

  // Exclude revoked sessions
  const activeSessions = allSessions.filter((session) => !revokedSet.has(session.id));

  return sendSuccess(res, activeSessions);
};

export const revokeSession = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  const sessionIdStr = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!userId) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  const revokedSet = getRevokedSet(userId);
  revokedSet.add(sessionIdStr);

  // Map session to human device names
  const deviceNames: Record<string, string> = {
    sess_mac: "MacBook Pro (Firefox)",
    sess_iphone: "Apple iPhone 15 (Safari Mobile)",
  };
  const targetDevice = deviceNames[sessionIdStr] || "Thiết bị phụ";

  // Log revocation event
  const ip = getClientIp(req);
  const parsedUa = parseUserAgent(req.headers["user-agent"]);
  const location = estimateLocation(ip);

  await ActivityLogModel.create({
    userId,
    action: "Đăng xuất thiết bị",
    description: `Hủy phiên đăng nhập và đăng xuất từ xa thiết bị: ${targetDevice}`,
    type: "logout",
    timestamp: new Date(),
    ip,
    userAgent: req.headers["user-agent"] || "Mozilla/5.0",
    location,
    device: `${parsedUa.browser} / ${parsedUa.device}`,
    riskLevel: "safe",
  });

  return sendSuccess(res, { message: "Session revoked successfully" });
};

export const revokeAllOtherSessions = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  const revokedSet = getRevokedSet(userId);
  revokedSet.add("sess_mac");
  revokedSet.add("sess_iphone");

  // Log bulk revocation event
  const ip = getClientIp(req);
  const parsedUa = parseUserAgent(req.headers["user-agent"]);
  const location = estimateLocation(ip);

  await ActivityLogModel.create({
    userId,
    action: "Đăng xuất thiết bị khác",
    description: "Đăng xuất từ xa khỏi toàn bộ các thiết bị khác đang hoạt động",
    type: "logout",
    timestamp: new Date(),
    ip,
    userAgent: req.headers["user-agent"] || "Mozilla/5.0",
    location,
    device: `${parsedUa.browser} / ${parsedUa.device}`,
    riskLevel: "safe",
  });

  return sendSuccess(res, { message: "All other sessions revoked successfully" });
};

export const getAllActivitiesAdmin = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  const logs = await ActivityLogModel.find()
    .populate("userId", "username displayName email avatarUrl")
    .sort({ timestamp: -1 });

  return sendSuccess(res, logs);
};

