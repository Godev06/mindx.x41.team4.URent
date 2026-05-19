import mongoose, { Schema } from 'mongoose';

const activityTypeValues = ['auth', 'update'] as const;

type ActivityType = (typeof activityTypeValues)[number];

export interface ActivityLogDocument extends mongoose.Document {
  userId?: mongoose.Types.ObjectId;
  action: string;
  description: string;
  timestamp: Date;
  type: ActivityType;
  notificationId?: mongoose.Types.ObjectId;
  eventKey?: string;
}

const activityLogSchema = new Schema<ActivityLogDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: activityTypeValues, required: true },
    notificationId: { type: Schema.Types.ObjectId, ref: 'Notification' },
    eventKey: { type: String, trim: true }
  },
  { timestamps: true }
);

activityLogSchema.index({ userId: 1, timestamp: -1 });

export const ActivityLogModel = mongoose.model<ActivityLogDocument>('ActivityLog', activityLogSchema);