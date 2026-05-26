import mongoose, { Schema } from 'mongoose';

const notificationTypeValues = ['order', 'message', 'promotion', 'system'] as const;

type NotificationType = (typeof notificationTypeValues)[number];

export interface NotificationDocument extends mongoose.Document {
  userId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: NotificationType;
  time?: string;
  read: boolean;
  readAt?: Date;
  activityLogId?: mongoose.Types.ObjectId;
  eventKey?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: { type: String, enum: notificationTypeValues, required: true },
    time: { type: String, trim: true },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    activityLogId: { type: Schema.Types.ObjectId, ref: 'ActivityLog' },
    eventKey: { type: String, trim: true },
    actionUrl: { type: String, trim: true },
    metadata: { type: Schema.Types.Map, of: Schema.Types.Mixed }
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<NotificationDocument>('Notification', notificationSchema);