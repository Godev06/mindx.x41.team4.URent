import mongoose, { Schema } from 'mongoose';

export interface FcmTokenDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  createdAt: Date;
  updatedAt: Date;
}

const fcmTokenSchema = new Schema<FcmTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    token: {
      type: String,
      required: true,
      unique: true
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
      default: 'desktop'
    }
  },
  { timestamps: true }
);

fcmTokenSchema.index({ userId: 1, token: 1 });

export const FcmTokenModel = mongoose.model<FcmTokenDocument>('FcmToken', fcmTokenSchema);
