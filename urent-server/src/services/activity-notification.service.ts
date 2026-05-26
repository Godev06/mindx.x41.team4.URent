import mongoose from "mongoose";
import {
  ActivityLogDocument,
  ActivityLogModel,
} from "../models/activity-log.model";
import {
  NotificationDocument,
  NotificationModel,
} from "../models/notification.model";
import { SettingsModel } from "../models/settings.model";
import { UserModel } from "../models/user.model";
import { emitNotificationToUser } from "../realtime/socket";
import { fcmPushService } from "./fcm-push.service";
import { sendNotificationEmail } from "./email.service";

interface CreateLinkedActivityNotificationInput {
  userId?: string;
  activity: {
    action: string;
    description: string;
    // Must match enum values in activity-log.model.ts
    type: "auth" | "update";
    timestamp?: Date;
  };
  notification: {
    title: string;
    description: string;
    type: "order" | "message" | "promotion" | "system";
    read?: boolean;
    readAt?: Date;
    actionUrl?: string;
    metadata?: Record<string, any>;
  };
  eventKey?: string;
}

interface CreateActivityOnlyInput {
  userId?: string;
  action: string;
  description: string;
  // Must match enum values in activity-log.model.ts
  type: "auth" | "update";
  timestamp?: Date;
  eventKey?: string;
}

const toObjectId = (value?: string): mongoose.Types.ObjectId | undefined => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    return undefined;
  }
  return new mongoose.Types.ObjectId(value);
};

export const createActivityOnly = async (
  input: CreateActivityOnlyInput,
): Promise<ActivityLogDocument> => {
  const userObjectId = toObjectId(input.userId);

  return ActivityLogModel.create({
    userId: userObjectId,
    action: input.action,
    description: input.description,
    type: input.type,
    timestamp: input.timestamp ?? new Date(),
    eventKey: input.eventKey,
  });
};

export const createLinkedActivityNotification = async (
  input: CreateLinkedActivityNotificationInput,
): Promise<{
  activityLog: ActivityLogDocument;
  notification: NotificationDocument;
}> => {
  const userObjectId = toObjectId(input.userId);
  const eventKey =
    input.eventKey ?? `evt_${new mongoose.Types.ObjectId().toString()}`;
  const session = await mongoose.startSession();

  let createdActivity: ActivityLogDocument | null = null;
  let createdNotification: NotificationDocument | null = null;

  try {
    await session.withTransaction(async () => {
      const [activity] = await ActivityLogModel.create(
        [
          {
            userId: userObjectId,
            action: input.activity.action,
            description: input.activity.description,
            type: input.activity.type,
            timestamp: input.activity.timestamp ?? new Date(),
            eventKey,
          },
        ],
        { session },
      );

      const [notification] = await NotificationModel.create(
        [
          {
            userId: userObjectId,
            title: input.notification.title,
            description: input.notification.description,
            type: input.notification.type,
            read: input.notification.read ?? false,
            readAt: input.notification.readAt,
            activityLogId: activity._id,
            eventKey,
            actionUrl: input.notification.actionUrl,
            metadata: input.notification.metadata,
          },
        ],
        { session },
      );

      activity.notificationId = notification._id as mongoose.Types.ObjectId;
      await activity.save({ session });

      createdActivity = activity;
      createdNotification = notification;
    });
  } finally {
    await session.endSession();
  }

  if (!createdActivity || !createdNotification) {
    throw new Error("Failed to create linked activity and notification");
  }

  // -------------------------------------------------------------
  // ĐA KÊNH TRUYỀN TẢI THÔNG BÁO (WS, FCM, EMAIL) SAU KHI LƯU DB THÀNH CÔNG
  // -------------------------------------------------------------
  if (input.userId) {
    // Chạy background xử lý phân phối để tránh block luồng chính
    (async () => {
      try {
        const notifType = input.notification.type;
        const title = input.notification.title;
        const description = input.notification.description;
        const actionUrl = input.notification.actionUrl;

        // 1. Lấy cấu hình cài đặt của user (Nếu chưa có, tạo cấu hình mặc định bật tất cả)
        let settings = await SettingsModel.findOne({ userId: input.userId });
        if (!settings) {
          settings = await SettingsModel.create({
            userId: new mongoose.Types.ObjectId(input.userId),
          });
        }

        // 2. Kênh In-App (WebSocket Real-time) - Dựa hoàn toàn vào cấu hình thông báo màn hình
        const canSendInApp = settings.screenNotifications !== false;
        if (canSendInApp) {
          emitNotificationToUser(input.userId, createdNotification);
          console.info(`🔔 [Notify Log - WS] Đã phát WebSocket thời gian thực tới user ${input.userId}:`, {
            title: createdNotification.title,
            type: createdNotification.type,
            actionUrl: createdNotification.actionUrl
          });
        }

        // 3. Kênh Web Push (FCM) - Dựa hoàn toàn vào cấu hình push chung
        const canSendPush = settings.pushNotifications !== false;
        if (canSendPush) {
          await fcmPushService.sendPushToUser(input.userId, {
            title,
            body: description,
            actionUrl,
            metadata: input.notification.metadata
              ? Object.entries(input.notification.metadata).reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {})
              : undefined,
          });
          console.info(`🔔 [Notify Log - FCM] Đã gửi thông báo Web Push tới user ${input.userId}:`, { title, actionUrl });
        }

        // 4. Kênh Email (Nodemailer) - Dựa hoàn toàn vào cấu hình email chung
        const canSendEmail = settings.emailNotifications !== false;
        if (canSendEmail) {
          const user = await UserModel.findById(input.userId).select('email').lean();
          if (user?.email) {
            await sendNotificationEmail(user.email, title, description, actionUrl);
            console.info(`🔔 [Notify Log - Email] Đã gửi thư điện tử tới user ${input.userId} (${user.email}):`, { title });
          }
        }
      } catch (err) {
        console.error(`[Notify Dispatch Error] Failed for user ${input.userId}:`, err);
      }
    })();
  }

  return {
    activityLog: createdActivity,
    notification: createdNotification,
  };
};
