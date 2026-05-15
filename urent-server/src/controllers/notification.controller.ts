import { Request, Response } from 'express';
import { NotificationModel } from '../models/notification.model';
import { AppError } from '../utils/app-error';
import { sendSuccess } from '../utils/api-response';
import { createLinkedActivityNotification } from '../services/activity-notification.service';
import {
  getNotificationsSchema,
  markAsReadSchema,
  markAllAsReadSchema,
  deleteNotificationSchema
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