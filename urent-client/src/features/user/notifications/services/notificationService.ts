import { apiClient } from "../../../../lib/api/apiClient";
import type {
  ApiNotification,
  ApiNotificationListMeta,
  ApiResponse,
  ApiUnreadCount,
} from "../types";

export type NotificationListResponse = {
  data: ApiNotification[];
  meta: ApiNotificationListMeta;
};

export const notificationService = {
  async getNotifications(
    params?: {
      page?: number;
      limit?: number;
      type?: 'order' | 'message' | 'promotion' | 'system';
      read?: boolean;
    },
    options?: { signal?: AbortSignal }
  ): Promise<NotificationListResponse> {
    const res = await apiClient.get<ApiResponse<ApiNotification[]>>(
      "/api/v1/notifications",
      {
        params,
        signal: options?.signal,
      }
    );
    return {
      data: res.data.data,
      meta: res.data.meta as ApiNotificationListMeta
    };
  },

  async getUnreadCount(options?: { signal?: AbortSignal }) {
    const res = await apiClient.get<ApiResponse<ApiUnreadCount>>(
      "/api/v1/notifications/unread-count",
      {
        signal: options?.signal,
      }
    );
    return res.data;
  },

  async markAsRead(notificationId: string) {
    const res = await apiClient.patch<ApiResponse<ApiNotification>>(
      `/api/v1/notifications/${notificationId}/read`
    );
    return res.data;
  },

  async markAllAsRead(type?: 'order' | 'message' | 'promotion' | 'system') {
    const res = await apiClient.patch<ApiResponse<{ modifiedCount: number }>>(
      "/api/v1/notifications/mark-all-read",
      {},
      { params: type ? { type } : undefined }
    );
    return res.data;
  },

  async deleteNotification(notificationId: string) {
    const res = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(
      `/api/v1/notifications/${notificationId}`
    );
    return res.data;
  },

  async saveFcmToken(token: string, deviceType: string = 'desktop') {
    const res = await apiClient.post<ApiResponse<{ success: boolean }>>(
      "/api/v1/notifications/fcm-token",
      { token, deviceType }
    );
    return res.data;
  },

  async deleteFcmToken(token: string) {
    const res = await apiClient.delete<ApiResponse<{ success: boolean }>>(
      "/api/v1/notifications/fcm-token",
      { params: { token } }
    );
    return res.data;
  },

  async getNotificationSettings() {
    const res = await apiClient.get<ApiResponse<any>>(
      "/api/v1/notifications/settings"
    );
    return res.data;
  },

  async updateNotificationSettings(settingsData: any) {
    const res = await apiClient.put<ApiResponse<any>>(
      "/api/v1/notifications/settings",
      settingsData
    );
    return res.data;
  },

  async broadcastNotification(broadcastData: {
    title: string;
    description: string;
    type: 'promotion' | 'system';
    actionUrl?: string;
    target?: 'all' | 'lessors' | 'lessees';
  }) {
    const res = await apiClient.post<ApiResponse<{ targetCount: number }>>(
      "/api/v1/notifications/broadcast",
      broadcastData
    );
    return res.data;
  },
};