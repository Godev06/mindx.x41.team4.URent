import mongoose, { Schema } from 'mongoose';

const themeValues = ['light', 'dark'] as const;
const languageValues = ['vi', 'en'] as const;

type Theme = (typeof themeValues)[number];
type Language = (typeof languageValues)[number];

export interface SettingsDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  theme: Theme;
  language: Language;
  emailNotifications: boolean;
  screenNotifications: boolean;
  twoFactorEnabled: boolean;
}

const settingsSchema = new Schema<SettingsDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    theme: {
      type: String,
      enum: themeValues,
      default: 'light'
    },
    language: {
      type: String,
      enum: languageValues,
      default: 'vi'
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    screenNotifications: {
      type: Boolean,
      default: true
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export const SettingsModel = mongoose.model<SettingsDocument>('Settings', settingsSchema);