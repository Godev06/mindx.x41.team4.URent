import mongoose from 'mongoose';
import { ActivityLogDocument, ActivityLogModel } from '../models/activity-log.model';
import { NotificationDocument, NotificationModel } from '../models/notification.model';

interface CreateLinkedActivityNotificationInput {
  userId?: string;
  activity: {
    action: string;
    description: string;
    type: 'auth' | 'order' | 'message' | 'update';
    timestamp?: Date;
  };
  notification: {
    title: string;
    description: string;
    type: 'order' | 'message' | 'promotion' | 'system';
    read?: boolean;
    readAt?: Date;
  };
  eventKey?: string;
}

interface CreateActivityOnlyInput {
  userId?: string;
  action: string;
  description: string;
  type: 'auth' | 'order' | 'message' | 'update';
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
  input: CreateActivityOnlyInput
): Promise<ActivityLogDocument> => {
  const userObjectId = toObjectId(input.userId);

  return ActivityLogModel.create({
    userId: userObjectId,
    action: input.action,
    description: input.description,
    type: input.type,
    timestamp: input.timestamp ?? new Date(),
    eventKey: input.eventKey
  });
};

export const createLinkedActivityNotification = async (
  input: CreateLinkedActivityNotificationInput
): Promise<{ activityLog: ActivityLogDocument; notification: NotificationDocument }> => {
  const userObjectId = toObjectId(input.userId);
  const eventKey = input.eventKey ?? `evt_${new mongoose.Types.ObjectId().toString()}`;
  const session = await mongoose.startSession();

  try {
    let createdActivity: ActivityLogDocument | null = null;
    let createdNotification: NotificationDocument | null = null;

    await session.withTransaction(async () => {
      const [activity] = await ActivityLogModel.create(
        [
          {
            userId: userObjectId,
            action: input.activity.action,
            description: input.activity.description,
            type: input.activity.type,
            timestamp: input.activity.timestamp ?? new Date(),
            eventKey
          }
        ],
        { session }
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
            eventKey
          }
        ],
        { session }
      );

      activity.notificationId = notification._id as mongoose.Types.ObjectId;
      await activity.save({ session });

      createdActivity = activity;
      createdNotification = notification;
    });

    if (!createdActivity || !createdNotification) {
      throw new Error('Failed to create linked activity and notification');
    }

    return {
      activityLog: createdActivity,
      notification: createdNotification
    };
  } finally {
    await session.endSession();
  }
};