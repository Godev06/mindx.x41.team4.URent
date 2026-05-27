import { Router } from 'express';
import { authGuard } from '../middlewares/auth.middleware';
import {
  getNotifications,
  markAsRead,
  getNotificationById,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  saveFcmToken,
  deleteFcmToken,
  getNotificationSettings,
  updateNotificationSettings,
  broadcastNotification
} from '../controllers/notification.controller';

export const notificationRouter = Router();

/**
 * @openapi
 * /api/v1/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Lấy danh sách thông báo của user hiện tại
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *         description: Số lượng item mỗi trang
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [order, message, promotion, system] }
 *         description: Lọc theo loại thông báo
 *       - in: query
 *         name: read
 *         schema: { type: boolean }
 *         description: Lọc theo trạng thái đã đọc
 *     responses:
 *       200:
 *         description: Danh sách notifications
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationListResponse'
 */
notificationRouter.get('/', authGuard, getNotifications);

/**
 * @openapi
 * /api/v1/notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Lấy số lượng thông báo chưa đọc
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Số lượng thông báo chưa đọc
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unreadCount:
 *                   type: integer
 */
notificationRouter.get('/unread-count', authGuard, getUnreadCount);

/**
 * @openapi
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Đánh dấu thông báo đã đọc
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID của notification
 *     responses:
 *       200:
 *         description: Thông báo đã được đánh dấu đã đọc
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationResponse'
 */
notificationRouter.patch('/:id/read', authGuard, markAsRead);

/**
 * @openapi
 * /api/v1/notifications/mark-all-read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Đánh dấu tất cả thông báo đã đọc
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [order, message, promotion, system] }
 *         description: Chỉ đánh dấu loại thông báo cụ thể
 *     responses:
 *       200:
 *         description: Số lượng thông báo đã được đánh dấu đã đọc
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 modifiedCount:
 *                   type: integer
 */
notificationRouter.patch('/mark-all-read', authGuard, markAllAsRead);

/**
 * @openapi
 * /api/v1/notifications/{id}:
 *   get:
 *     tags: [Notifications]
 *     summary: Lấy thông tin chi tiết của một thông báo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID của notification
 *     responses:
 *       200:
 *         description: Chi tiết notification
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationResponse'
 */
notificationRouter.get('/:id', authGuard, getNotificationById);

/**
 * @openapi
 * /api/v1/notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Xóa thông báo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID của notification
 *     responses:
 *       200:
 *         description: Thông báo đã được xóa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deleted:
 *                   type: boolean
 */
notificationRouter.delete('/:id', authGuard, deleteNotification);

// FCM Tokens
notificationRouter.post('/fcm-token', authGuard, saveFcmToken);
notificationRouter.delete('/fcm-token', authGuard, deleteFcmToken);

// Preferences Cài đặt thông báo
notificationRouter.get('/settings', authGuard, getNotificationSettings);
notificationRouter.put('/settings', authGuard, updateNotificationSettings);

// Broadcast diện rộng (Admin only)
notificationRouter.post('/broadcast', authGuard, broadcastNotification);