export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: any;
}

export interface ApiNotification {
  _id: string;
  userId?: string;
  title: string;
  description: string;
  type: 'order' | 'message' | 'promotion' | 'system';
  time?: string;
  read: boolean;
  readAt?: string;
  activityLogId?: string;
  eventKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiNotificationListMeta {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiUnreadCount {
  unreadCount: number;
}