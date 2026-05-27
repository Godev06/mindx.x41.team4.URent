import { apiClient } from "../../../../lib/api/apiClient";
import type { UserSettings } from "../types";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

const mapUserSettings = (value: unknown): UserSettings => {
  const source = isRecord(value) && isRecord(value.data) ? value.data : value;

  if (!isRecord(source)) {
    throw new Error("Khong doc duoc cai dat bao mat.");
  }

  return {
    twoFactorEnabled: Boolean(source.twoFactorEnabled),
    isPasswordSet: typeof source.isPasswordSet === "boolean" ? source.isPasswordSet : undefined,
  };
};

export const settingsService = {
  async getSettings(): Promise<UserSettings> {
    const response = await apiClient.get<unknown>("/api/v1/settings");
    return mapUserSettings(response.data);
  },

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

  async requestTwoFactorOtp(): Promise<void> {
    await apiClient.post("/api/v1/settings/2fa/otp");
  },

  async updatePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await apiClient.patch("/api/v1/profile", {
      currentPassword,
      newPassword,
    });
  },

  async getActivities(): Promise<any[]> {
    const response = await apiClient.get<any>("/api/v1/activities");
    return isRecord(response.data) && Array.isArray(response.data.data) ? response.data.data : [];
  },

  async clearActivities(): Promise<void> {
    await apiClient.delete("/api/v1/activities");
  },

  async getSessions(): Promise<any[]> {
    const response = await apiClient.get<any>("/api/v1/activities/sessions");
    return isRecord(response.data) && Array.isArray(response.data.data) ? response.data.data : [];
  },

  async revokeSession(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/activities/sessions/${id}`);
  },

  async revokeAllOtherSessions(): Promise<void> {
    await apiClient.delete("/api/v1/activities/sessions");
  },
};