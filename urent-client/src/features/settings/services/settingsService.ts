import { apiClient } from "../../../lib/api/apiClient";
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
  };
};

export const settingsService = {
  async getSettings(): Promise<UserSettings> {
    const response = await apiClient.get<unknown>("/api/settings");
    return mapUserSettings(response.data);
  },

  async updateTwoFactorEnabled(twoFactorEnabled: boolean): Promise<UserSettings> {
    const response = await apiClient.patch<unknown>("/api/settings", {
      twoFactorEnabled,
    });
    return mapUserSettings(response.data);
  },
};