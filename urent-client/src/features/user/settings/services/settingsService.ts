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
    twoFactorEnabled: boolean
  ): Promise<UserSettings> {
    const response = await apiClient.patch<unknown>("/api/v1/settings", {
      twoFactorEnabled,
    });
    return mapUserSettings(response.data);
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
};