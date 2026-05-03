import { apiClient } from "../../../../lib/api/apiClient";
import type { AuthUser } from "../../auth/types";
import { mapAuthUser } from "../../auth/utils/authResponse";
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

  async verifyPhone(idToken: string): Promise<AuthUser> {
    const response = await apiClient.post<unknown>("/api/v1/profile/verify-phone", { idToken });
    const user = mapAuthUser(response.data);

    if (!user) {
      throw new Error("Xac minh so dien thoai thanh cong nhung khong dong bo duoc ho so.");
    }

    return user;
  },
};