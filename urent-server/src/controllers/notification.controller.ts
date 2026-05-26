import { Request, Response } from 'express';
import { NotificationModel } from '../models/notification.model';
import { SettingsModel } from '../models/settings.model';
import { FcmTokenModel } from '../models/fcm-token.model';
import { UserModel } from '../models/user.model';
import { AppError } from '../utils/app-error';
import { sendSuccess } from '../utils/api-response';
import { createLinkedActivityNotification } from '../services/activity-notification.service';
import {
  getNotificationsSchema,
  markAsReadSchema,
  markAllAsReadSchema,
  deleteNotificationSchema,
  saveFcmTokenSchema,
  deleteFcmTokenSchema,
  updateNotificationSettingsSchema,
  broadcastNotificationSchema
} from '../validators/notification.validator';

const requireUserId = (req: Request) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');
  }
  return userId;
};

export const getNotifications = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { page = 1, limit = 10, type, read } = getNotificationsSchema.parse(req).query;

  const query: any = { userId };
  if (type) query.type = type;
  if (read !== undefined) query.read = read;

  const skip = (page - 1) * limit;
  const notifications = await NotificationModel.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('activityLogId', 'action description type timestamp');

  const total = await NotificationModel.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  return sendSuccess(res, notifications, {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
};

export const markAsRead = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { id } = markAsReadSchema.parse(req).params;

  const notification = await NotificationModel.findOneAndUpdate(
    { _id: id, userId },
    { read: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    throw new AppError(404, 'NOT_FOUND', 'Notification not found');
  }

  return sendSuccess(res, notification);
};

export const markAllAsRead = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { type } = markAllAsReadSchema.parse(req).query;

  const query: any = { userId, read: false };
  if (type) query.type = type;

  const result = await NotificationModel.updateMany(query, {
    read: true,
    readAt: new Date()
  });

  return sendSuccess(res, { modifiedCount: result.modifiedCount });
};

export const deleteNotification = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { id } = deleteNotificationSchema.parse(req).params;

  const notification = await NotificationModel.findOneAndDelete({
    _id: id,
    userId
  });

  if (!notification) {
    throw new AppError(404, 'NOT_FOUND', 'Notification not found');
  }

  return sendSuccess(res, { deleted: true });
};

export const getUnreadCount = async (req: Request, res: Response) => {
  const userId = requireUserId(req);

  const count = await NotificationModel.countDocuments({
    userId,
    read: false
  });

  return sendSuccess(res, { unreadCount: count });
};

export const saveFcmToken = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { token, deviceType } = saveFcmTokenSchema.parse(req).body;

  // Sử dụng findOneAndUpdate để upsert token tránh trùng lặp thiết bị
  await FcmTokenModel.findOneAndUpdate(
    { token },
    { userId, deviceType },
    { upsert: true, new: true }
  );

  return sendSuccess(res, { success: true });
};

export const deleteFcmToken = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { token } = deleteFcmTokenSchema.parse(req).body;

  await FcmTokenModel.findOneAndDelete({ token, userId });

  return sendSuccess(res, { success: true });
};

export const getNotificationSettings = async (req: Request, res: Response) => {
  const userId = requireUserId(req);

  let settings = await SettingsModel.findOne({ userId });
  if (!settings) {
    settings = await SettingsModel.create({ userId });
  }

  return sendSuccess(res, settings);
};

export const updateNotificationSettings = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const updateData = updateNotificationSettingsSchema.parse(req).body;

  const settings = await SettingsModel.findOneAndUpdate(
    { userId },
    { $set: updateData },
    { new: true, upsert: true }
  );

  return sendSuccess(res, settings);
};

export const broadcastNotification = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  
  // Xác thực quyền admin
  const user = await UserModel.findById(userId).select('role').lean();
  if (!user || user.role !== 'admin') {
    throw new AppError(403, 'FORBIDDEN', 'Access denied. Admins only.');
  }

  const { title, description, type, actionUrl, target } = broadcastNotificationSchema.parse(req).body;

  // Lọc danh sách người dùng mục tiêu
  const query: any = {};
  if (target === 'lessors') {
    query.role = 'user'; // Mặc định trong cấu hình đơn giản của dự án
  } else if (target === 'lessees') {
    query.role = 'user';
  }

  const targetUsers = await UserModel.find(query).select('_id').lean();

  // Trả về kết quả lập tức cho admin và chạy background để tránh block phản hồi
  res.status(202).json({
    success: true,
    message: `Đang phát sóng thông báo tới ${targetUsers.length} người dùng...`,
    data: { targetCount: targetUsers.length }
  });

  (async () => {
    for (const u of targetUsers) {
      try {
        await createLinkedActivityNotification({
          userId: String(u._id),
          activity: {
            action: 'system_broadcast',
            description: `Thông báo hệ thống: ${title}`,
            type: 'update'
          },
          notification: {
            title,
            description,
            type,
            actionUrl
          }
        });
      } catch (err) {
        console.error(`[Broadcast Error] Lỗi gửi thông báo cho user ${u._id}:`, err);
      }
    }
  })();
};