import { useCallback, useEffect, useState } from "react";
import { normalizeApiError } from "../../../../lib/api/apiError";
import { notificationService } from "../services/notificationService";
import type { ApiNotification } from "../types";

export function useNotifications(params?: {
  page?: number;
  limit?: number;
  type?: 'order' | 'message' | 'promotion' | 'system';
  read?: boolean;
}) {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paramsKey = JSON.stringify(params ?? {});

  const refresh = useCallback(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    notificationService
      .getNotifications(params)
      .then((res) => {
        if (!cancelled) {
          setNotifications(res.data);
          setPagination(res.meta.pagination);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setError(normalizeApiError(error).message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [paramsKey]);

  useEffect(() => {
    return refresh();
  }, [refresh]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === notificationId
            ? { ...notification, read: true, readAt: new Date().toISOString() }
            : notification
        )
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }, []);

  const markAllAsRead = useCallback(async (type?: 'order' | 'message' | 'promotion' | 'system') => {
    try {
      const result = await notificationService.markAllAsRead(type);
      setNotifications(prev =>
        prev.map(notification =>
          !notification.read && (!type || notification.type === type)
            ? { ...notification, read: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      return result.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      throw normalizeApiError(error);
    }
  }, []);

  return {
    notifications,
    pagination,
    isLoading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
}

export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    notificationService
      .getUnreadCount()
      .then((res) => {
        if (!cancelled) {
          setUnreadCount(res.data.unreadCount);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setError(normalizeApiError(error).message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return refresh();
  }, [refresh]);

  return {
    unreadCount,
    isLoading,
    error,
    refresh
  };
}