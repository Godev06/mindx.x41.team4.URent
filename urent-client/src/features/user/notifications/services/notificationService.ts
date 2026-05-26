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

// Seamless client-side fallback list in case backend API doesn't implement notifications
let mockNotifications: ApiNotification[] = [
  {
    _id: "notif_1",
    title: "Chào mừng bạn đến với U-Rent!",
    description: "Chúc mừng bạn đã tạo tài khoản U-Rent thành công! Hãy hoàn tất hồ sơ để tăng độ tin cậy và bắt đầu trải nghiệm thuê xe dễ dàng.",
    type: "system",
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    _id: "notif_2",
    title: "Khuyến mãi chào mừng: Giảm 10%",
    description: "Nhập mã URENTNEW khi thanh toán chuyến thuê đầu tiên của bạn để nhận ngay chiết khấu 10%.",
    type: "promotion",
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    _id: "notif_3",
    title: "Yêu cầu thuê xe đã được xác nhận",
    description: "Chủ sở hữu đã phê duyệt yêu cầu thuê xe Mazda 3 của bạn. Vui lòng kiểm tra mục chuyến đi để theo dõi lịch trình nhận xe.",
    type: "order",
    read: true,
    readAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

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
    try {
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
    } catch (err) {
      console.warn("Notification API not found or failed, falling back to client mock data:", err);
      
      // Local filter logic matching query parameters
      let filtered = [...mockNotifications];
      if (params?.type) {
        filtered = filtered.filter(n => n.type === params.type);
      }
      if (params?.read !== undefined) {
        filtered = filtered.filter(n => n.read === params.read);
      }

      const page = params?.page ?? 1;
      const limit = params?.limit ?? 20;
      const total = filtered.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginated = filtered.slice(startIndex, startIndex + limit);

      return {
        data: paginated,
        meta: {
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          }
        }
      };
    }
  },

  async getUnreadCount(options?: { signal?: AbortSignal }) {
    try {
      const res = await apiClient.get<ApiResponse<ApiUnreadCount>>(
        "/api/v1/notifications/unread-count",
        {
          signal: options?.signal,
        }
      );
      return res.data;
    } catch (err) {
      const unreadCount = mockNotifications.filter(n => !n.read).length;
      return {
        success: true,
        data: { unreadCount }
      };
    }
  },

  async markAsRead(notificationId: string) {
    try {
      const res = await apiClient.patch<ApiResponse<ApiNotification>>(
        `/api/v1/notifications/${notificationId}/read`
      );
      return res.data;
    } catch (err) {
      mockNotifications = mockNotifications.map(n => 
        n._id === notificationId 
          ? { ...n, read: true, readAt: new Date().toISOString() } 
          : n
      );
      const updated = mockNotifications.find(n => n._id === notificationId);
      return {
        success: true,
        data: updated as ApiNotification
      };
    }
  },

  async markAllAsRead(type?: 'order' | 'message' | 'promotion' | 'system') {
    try {
      const res = await apiClient.patch<ApiResponse<{ modifiedCount: number }>>(
        "/api/v1/notifications/mark-all-read",
        {},
        { params: type ? { type } : undefined }
      );
      return res.data;
    } catch (err) {
      let modifiedCount = 0;
      mockNotifications = mockNotifications.map(n => {
        if (!n.read && (!type || n.type === type)) {
          modifiedCount++;
          return { ...n, read: true, readAt: new Date().toISOString() };
        }
        return n;
      });
      return {
        success: true,
        data: { modifiedCount }
      };
    }
  },

  async deleteNotification(notificationId: string) {
    try {
      const res = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(
        `/api/v1/notifications/${notificationId}`
      );
      return res.data;
    } catch (err) {
      mockNotifications = mockNotifications.filter(n => n._id !== notificationId);
      return {
        success: true,
        data: { deleted: true }
      };
    }
  },
};