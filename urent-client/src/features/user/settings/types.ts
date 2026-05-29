export interface UserSettings {
  twoFactorEnabled: boolean;
  isPasswordSet?: boolean;
}

export type Theme = "light" | "dark";
export type Language = "vi" | "en";

export interface NotificationChannelPreference {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export interface NotificationPreferences {
  orderUpdates?: Partial<NotificationChannelPreference>;
  chatMessages?: Partial<NotificationChannelPreference>;
  promotions?: Partial<NotificationChannelPreference>;
  systemAlerts?: Partial<NotificationChannelPreference>;
}

/** Full settings document returned by GET /api/v1/settings */
export interface FullUserSettings {
  _id?: string;
  userId?: string;
  theme: Theme;
  language: Language;
  emailNotifications: boolean;
  screenNotifications: boolean;
  pushNotifications: boolean;
  soundNotifications: boolean;
  twoFactorEnabled: boolean;
  isPasswordSet?: boolean;
  preferences: NotificationPreferences;
  createdAt?: string;
  updatedAt?: string;
}

/** Partial payload for PATCH /api/v1/settings */
export interface UpdateSettingsPayload {
  theme?: Theme;
  language?: Language;
  emailNotifications?: boolean;
  screenNotifications?: boolean;
  pushNotifications?: boolean;
  soundNotifications?: boolean;
  twoFactorEnabled?: boolean;
  otp?: string;
  preferences?: NotificationPreferences;
}