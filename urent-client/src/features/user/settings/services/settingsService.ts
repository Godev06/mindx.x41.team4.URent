import { apiClient } from "../../../../lib/api/apiClient";
import type {
  UserSettings,
  FullUserSettings,
  UpdateSettingsPayload,
} from "../types";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

// ─── Mappers ─────────────────────────────────────────────────────────────────

const mapUserSettings = (value: unknown): UserSettings => {
  const source = isRecord(value) && isRecord(value.data) ? value.data : value;

  if (!isRecord(source)) {
    throw new Error("Khong doc duoc cai dat bao mat.");
  }

  return {
    twoFactorEnabled: Boolean(source.twoFactorEnabled),
    isPasswordSet:
      typeof source.isPasswordSet === "boolean"
        ? source.isPasswordSet
        : undefined,
  };
};

const mapFullSettings = (value: unknown): FullUserSettings => {
  const source = isRecord(value) && isRecord(value.data) ? value.data : value;

  if (!isRecord(source)) {
    throw new Error("Khong doc duoc cai dat.");
  }

  return {
    _id: source._id as string | undefined,
    userId: source.userId as string | undefined,
    theme: (source.theme as "light" | "dark") ?? "light",
    language: (source.language as "vi" | "en") ?? "vi",
    emailNotifications: Boolean(source.emailNotifications ?? true),
    screenNotifications: Boolean(source.screenNotifications ?? true),
    pushNotifications: Boolean(source.pushNotifications ?? true),
    soundNotifications: Boolean(source.soundNotifications ?? true),
    twoFactorEnabled: Boolean(source.twoFactorEnabled),
    isPasswordSet:
      typeof source.isPasswordSet === "boolean"
        ? source.isPasswordSet
        : undefined,
    preferences: (source.preferences as FullUserSettings["preferences"]) ?? {},
    createdAt: source.createdAt as string | undefined,
    updatedAt: source.updatedAt as string | undefined,
  };
};

// ─── Service ─────────────────────────────────────────────────────────────────

export const settingsService = {
  /**
   * GET /api/v1/settings
   * Lấy toàn bộ cài đặt người dùng (bảo mật + giao diện + thông báo).
   * Tự tạo document với giá trị mặc định nếu chưa tồn tại.
   */
  async getSettings(): Promise<UserSettings> {
    const response = await apiClient.get<unknown>("/api/v1/settings");
    return mapUserSettings(response.data);
  },

  /**
   * GET /api/v1/settings (full)
   * Lấy đầy đủ các thông số cài đặt (theme, language, notifications, preferences…).
   */
  async getFullSettings(): Promise<FullUserSettings> {
    const response = await apiClient.get<unknown>("/api/v1/settings");
    return mapFullSettings(response.data);
  },

  /**
   * PATCH /api/v1/settings
   * Cập nhật một hoặc nhiều thông số cài đặt cùng lúc.
   *
   * Hỗ trợ:
   *   - theme: "light" | "dark"
   *   - language: "vi" | "en"
   *   - emailNotifications: boolean
   *   - screenNotifications: boolean
   *   - pushNotifications: boolean
   *   - soundNotifications: boolean
   *   - twoFactorEnabled: boolean  (yêu cầu otp đính kèm)
   *   - preferences.orderUpdates / chatMessages / promotions / systemAlerts
   */
  async updateSettings(payload: UpdateSettingsPayload): Promise<FullUserSettings> {
    const response = await apiClient.patch<unknown>("/api/v1/settings", payload);
    return mapFullSettings(response.data);
  },

  /**
   * Cập nhật chủ đề giao diện (Light / Dark).
   */
  async updateTheme(theme: "light" | "dark"): Promise<FullUserSettings> {
    return this.updateSettings({ theme });
  },

  /**
   * Cập nhật ngôn ngữ hiển thị.
   */
  async updateLanguage(language: "vi" | "en"): Promise<FullUserSettings> {
    return this.updateSettings({ language });
  },

  /**
   * Bật / tắt 2FA (yêu cầu kèm mã OTP đã xác thực).
   */
  async updateTwoFactorEnabled(
    twoFactorEnabled: boolean,
    otp?: string
  ): Promise<UserSettings> {
    const response = await apiClient.patch<unknown>("/api/v1/settings", {
      twoFactorEnabled,
      otp,
    });
    return mapUserSettings(response.data);
  },

  /**
   * Gửi mã OTP để xác minh bật/tắt 2FA.
   */
  async requestTwoFactorOtp(): Promise<void> {
    await apiClient.post("/api/v1/settings/2fa/otp");
  },

  /**
   * Đổi mật khẩu người dùng.
   */
  async updatePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await apiClient.patch("/api/v1/profile", {
      currentPassword,
      newPassword,
    });
  },

  // ─── Activity & Session Logs ────────────────────────────────────────────────

  async getActivities(): Promise<any[]> {
    const response = await apiClient.get<any>("/api/v1/activities");
    return isRecord(response.data) && Array.isArray(response.data.data)
      ? response.data.data
      : [];
  },

  async clearActivities(): Promise<void> {
    await apiClient.delete("/api/v1/activities");
  },

  async getSessions(): Promise<any[]> {
    const response = await apiClient.get<any>("/api/v1/activities/sessions");
    return isRecord(response.data) && Array.isArray(response.data.data)
      ? response.data.data
      : [];
  },

  async revokeSession(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/activities/sessions/${id}`);
  },

  async revokeAllOtherSessions(): Promise<void> {
    await apiClient.delete("/api/v1/activities/sessions");
  },
};