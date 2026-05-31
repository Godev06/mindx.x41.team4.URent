import { Router } from "express";
import { authGuard } from "../middlewares/auth.middleware";
import { adminGuard } from "../middlewares/admin-guard.middleware";
import {
  getActivities,
  clearActivities,
  getSessions,
  revokeSession,
  revokeAllOtherSessions,
  getAllActivitiesAdmin
} from "../controllers/activity.controller";

export const activityRouter = Router();

activityRouter.get("/admin/all", authGuard, adminGuard, getAllActivitiesAdmin);

/**
 * @openapi
 * /api/v1/activities:
 *   get:
 *     tags: [Activities]
 *     summary: Lấy danh sách lịch sử hoạt động bảo mật
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách hoạt động
 */
activityRouter.get("/", authGuard, getActivities);

/**
 * @openapi
 * /api/v1/activities:
 *   delete:
 *     tags: [Activities]
 *     summary: Xóa toàn bộ lịch sử hoạt động bảo mật
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đã xóa thành công
 */
activityRouter.delete("/", authGuard, clearActivities);

/**
 * @openapi
 * /api/v1/activities/sessions:
 *   get:
 *     tags: [Activities]
 *     summary: Lấy danh sách phiên đăng nhập thiết bị đang hoạt động
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách phiên đăng nhập
 */
activityRouter.get("/sessions", authGuard, getSessions);

/**
 * @openapi
 * /api/v1/activities/sessions:
 *   delete:
 *     tags: [Activities]
 *     summary: Đăng xuất khỏi tất cả các thiết bị khác
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đã đăng xuất thành công
 */
activityRouter.delete("/sessions", authGuard, revokeAllOtherSessions);

/**
 * @openapi
 * /api/v1/activities/sessions/{id}:
 *   delete:
 *     tags: [Activities]
 *     summary: Đăng xuất một thiết bị cụ thể từ xa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã thu hồi thành công
 */
activityRouter.delete("/sessions/:id", authGuard, revokeSession);
