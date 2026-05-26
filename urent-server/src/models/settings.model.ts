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
  pushNotifications: boolean;
  soundNotifications: boolean;
  twoFactorEnabled: boolean;
  preferences: {
    orderUpdates: { email: boolean; push: boolean; inApp: boolean };
    chatMessages: { email: boolean; push: boolean; inApp: boolean };
    promotions: { email: boolean; push: boolean; inApp: boolean };
    systemAlerts: { email: boolean; push: boolean; inApp: boolean };
  };
}

const channelPreferenceSchema = new Schema(
  {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true }
  },
  { _id: false }
);

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
    pushNotifications: {
      type: Boolean,
      default: true
    },
    soundNotifications: {
      type: Boolean,
      default: true
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    preferences: {
      type: {
        orderUpdates: { type: channelPreferenceSchema, default: () => ({}) },
        chatMessages: { type: channelPreferenceSchema, default: () => ({}) },
        promotions: { type: channelPreferenceSchema, default: () => ({}) },
        systemAlerts: { type: channelPreferenceSchema, default: () => ({}) }
      },
      default: () => ({})
    }
  },
  { timestamps: true }
);

export const SettingsModel = mongoose.model<SettingsDocument>('Settings', settingsSchema);