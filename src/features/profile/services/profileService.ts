import { apiClient } from "../../../lib/api/apiClient";
import { mapAuthUser } from "../../auth/utils/authResponse";
import type { AuthUser, ProfileUpdatePayload } from "../../auth/types";

const buildProfileUpdatePayload = (payload: ProfileUpdatePayload) => {
  const normalizedDisplayName = payload.displayName.trim();
  const normalizedBio = payload.bio.trim();
  const normalizedPhone = payload.phone.trim().replace(/\s+/g, "");

  const requestPayload: Record<string, string> = {
    displayName: normalizedDisplayName,
  };

  if (normalizedBio) {
    requestPayload.bio = normalizedBio;
  }

  if (normalizedPhone) {
    requestPayload.phone = normalizedPhone;
  }

  return requestPayload;
};

export const profileService = {
  async updateProfile(payload: ProfileUpdatePayload): Promise<AuthUser> {
    const requestPayload = buildProfileUpdatePayload(payload);
    const response = await apiClient.patch<unknown>(
      "/api/profile",
      requestPayload,
    );
    const user = mapAuthUser(response.data);

    if (!user) {
      throw new Error("Cap nhat ho so thanh cong nhung khong doc duoc du lieu moi.");
    }

    return user;
  },

  async uploadAvatar(file: File): Promise<AuthUser> {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await apiClient.post<unknown>("/api/profile/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const user = mapAuthUser(response.data);

    if (!user) {
      throw new Error("Tai avatar thanh cong nhung khong doc duoc du lieu nguoi dung.");
    }

    return user;
  },
};
