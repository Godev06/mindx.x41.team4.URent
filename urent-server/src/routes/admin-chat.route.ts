import { Router } from "express";
import { authGuard } from "../middlewares/auth.middleware";
import { sendError, sendSuccess } from "../utils/api-response";
import { AppError } from "../utils/app-error";
import {
  getOrCreateSupportConversation,
  listAllSupportConversations,
} from "../services/admin-chat.service";

export const adminChatRouter = Router();

/**
 * Middleware phân quyền nghiêm ngặt theo danh sách role được phép.
 */
export const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return sendError(
        res,
        {
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        },
        401,
      );
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        {
          code: "FORBIDDEN",
          message: `Access denied. Role ${req.user.role} is not authorized.`,
        },
        403,
      );
    }

    return next();
  };
};

/**
 * @openapi
 * /api/v1/conversations/support:
 *   post:
 *     tags: [AdminChat]
 *     summary: Tìm hoặc tạo mới phòng chat support giữa khách hàng hiện tại và hệ thống admin.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Trả về thông tin phòng chat support đã tạo/tìm thấy.
 */
adminChatRouter.post(
  "/conversations/support",
  authGuard,
  async (req, res, next) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
      }

      const conversation = await getOrCreateSupportConversation(userId);
      return sendSuccess(res, conversation, undefined, 201);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /api/v1/admin/chat/conversations:
 *   get:
 *     tags: [AdminChat]
 *     summary: Lấy toàn bộ danh sách các cuộc hội thoại support hệ thống.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 20 }
 *     responses:
 *       200:
 *         description: Danh sách conversations hỗ trợ.
 */
adminChatRouter.get(
  "/admin/chat/conversations",
  authGuard,
  requireRole(["admin"]),
  async (req, res, next) => {
    try {
      const limitVal = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
      const cursorVal = req.query.cursor ? String(req.query.cursor) : undefined;

      const result = await listAllSupportConversations({
        limit: limitVal,
        cursor: cursorVal,
      });

      return sendSuccess(res, result.items, {
        limit: result.limit,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      });
    } catch (error) {
      next(error);
    }
  },
);
