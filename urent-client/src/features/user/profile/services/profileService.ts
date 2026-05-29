import { apiClient } from "../../../../lib/api/apiClient";
import { mapAuthUser } from "../../auth/utils/authResponse";
import type { AuthUser, ProfileUpdatePayload } from "../../auth/types";
import type { Product } from "../../shared/types";

const buildProfileUpdatePayload = (payload: ProfileUpdatePayload) => {
  const normalizedDisplayName = payload.displayName.trim();
  const normalizedBio = payload.bio.trim();
  const normalizedPhone = payload.phone.trim().replace(/\s+/g, "");
  const normalizedAddress = payload.address?.trim() ?? "";

  const requestPayload: Record<string, string> = {
    displayName: normalizedDisplayName,
  };

  if (normalizedBio) {
    requestPayload.bio = normalizedBio;
  }

  if (normalizedPhone) {
    requestPayload.phone = normalizedPhone;
  }

  if (normalizedAddress !== undefined) {
    requestPayload.address = normalizedAddress;
  }

  return requestPayload;
};

export const profileService = {
  async updateProfile(payload: ProfileUpdatePayload): Promise<AuthUser> {
    const requestPayload = buildProfileUpdatePayload(payload);
    const response = await apiClient.patch<unknown>(
      "/api/v1/profile",
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

    const response = await apiClient.post<unknown>("/api/v1/profile/avatar", formData, {
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

  // --- HÀM MỚI ---
  async getFavorites(): Promise<Product[]> {
    const response = await apiClient.get<{ success: boolean; data: Product[] }>("/api/v1/profile/favorites");
    return response.data.data;
  },

  async toggleFavorite(productId: string): Promise<{ isWishlisted: boolean, favoriteProducts: string[] }> {
    const response = await apiClient.post<{ success: boolean; data: { isWishlisted: boolean, favoriteProducts: string[] } }>(`/api/v1/profile/favorites/${productId}`);
    return response.data.data;
  },
};