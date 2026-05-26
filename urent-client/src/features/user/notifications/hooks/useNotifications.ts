import { useCallback, useEffect, useReducer, useRef } from "react";
import axios from "axios";
import { normalizeApiError } from "../../../../lib/api/apiError";
import { notificationService } from "../services/notificationService";
import type { ApiNotification, ApiNotificationListMeta } from "../types";

// ==========================================
// 1. Types & Interfaces
// ==========================================

export interface UseNotificationsParams {
  page?: number;
  limit?: number;
  type?: 'order' | 'message' | 'promotion' | 'system';
  read?: boolean;
}

export interface NotificationsState {
  data: ApiNotification[];
  pagination: ApiNotificationListMeta['pagination'] | null;
  isLoading: boolean;
  error: string | null;
}

export type NotificationsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: { data: ApiNotification[]; pagination: ApiNotificationListMeta['pagination'] | null } }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'MARK_READ'; payload: { notificationId: string; readAt: string } }
  | { type: 'MARK_ALL_READ'; payload: { type?: 'order' | 'message' | 'promotion' | 'system'; readAt: string } }
  | { type: 'DELETE'; payload: { notificationId: string } }
  | { type: 'ADD_NEW'; payload: ApiNotification };

export interface UseNotificationsReturn {
  notifications: ApiNotification[];
  data: ApiNotification[];
  pagination: ApiNotificationListMeta['pagination'] | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => () => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (type?: 'order' | 'message' | 'promotion' | 'system') => Promise<unknown>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

export interface UnreadCountState {
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

export type UnreadCountAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: number }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'INCREMENT_COUNT' };

export interface UseUnreadCountReturn {
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => () => void;
}

// ==========================================
// 2. Helpers (Custom Value Comparison)
// ==========================================

function isDeepEqual(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;

  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!isDeepEqual(a[key], b[key])) return false;
  }

  return true;
}

function useDeepCompareMemoize<T>(value: T): T {
  const ref = useRef<T>(value);
  if (!isDeepEqual(value, ref.current)) {
    ref.current = value;
  }
  return ref.current;
}

// ==========================================
// 3. Reducers
// ==========================================

function notificationsReducer(state: NotificationsState, action: NotificationsAction): NotificationsState {
  switch (action.type) {
    case 'ADD_NEW':
      if (state.data.some(n => n._id === action.payload._id)) {
        return state;
      }
      return {
        ...state,
        data: [action.payload, ...state.data],
      };
    case 'FETCH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        data: action.payload.data,
        pagination: action.payload.pagination,
      };
    case 'FETCH_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.error,
      };
    case 'MARK_READ':
      return {
        ...state,
        data: state.data.map(notification =>
          notification._id === action.payload.notificationId
            ? { ...notification, read: true, readAt: action.payload.readAt }
            : notification
        ),
      };
    case 'MARK_ALL_READ':
      return {
        ...state,
        data: state.data.map(notification =>
          !notification.read && (!action.payload.type || notification.type === action.payload.type)
            ? { ...notification, read: true, readAt: action.payload.readAt }
            : notification
        ),
      };
    case 'DELETE':
      return {
        ...state,
        data: state.data.filter(n => n._id !== action.payload.notificationId),
      };
    default:
      return state;
  }
}

function unreadCountReducer(state: UnreadCountState, action: UnreadCountAction): UnreadCountState {
  switch (action.type) {
    case 'INCREMENT_COUNT':
      return {
        ...state,
        unreadCount: state.unreadCount + 1,
      };
    case 'FETCH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        unreadCount: action.payload,
      };
    case 'FETCH_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.error,
      };
    default:
      return state;
  }
}

// ==========================================
// 4. Custom Hooks
// ==========================================

export function useNotifications(params?: UseNotificationsParams): UseNotificationsReturn {
  const memoizedParams = useDeepCompareMemoize(params);

  const [state, dispatch] = useReducer(notificationsReducer, {
    data: [],
    pagination: null,
    isLoading: true,
    error: null,
  });

  const refresh = useCallback(() => {
    const abortController = new AbortController();

    dispatch({ type: 'FETCH_START' });

    notificationService
      .getNotifications(memoizedParams, { signal: abortController.signal })
      .then((res) => {
        dispatch({
          type: 'FETCH_SUCCESS',
          payload: {
            data: res.data,
            pagination: res.meta?.pagination ?? null,
          },
        });
      })
      .catch((error: unknown) => {
        if (
          axios.isCancel(error) ||
          (error instanceof Error && error.name === 'CanceledError') ||
          (error as any)?.code === 'ERR_CANCELED'
        ) {
          return;
        }
        dispatch({
          type: 'FETCH_ERROR',
          error: normalizeApiError(error).message,
        });
      });

    return () => {
      abortController.abort();
    };
  }, [memoizedParams]);

  useEffect(() => {
    return refresh();
  }, [refresh]);

  useEffect(() => {
    const handleNotificationCreated = (event: Event) => {
      const notification = (event as CustomEvent).detail;
      if (notification) {
        console.info("🔔 [Real-time Log] useNotifications hook nhận thông báo:", notification);
        dispatch({ type: 'ADD_NEW', payload: notification });
      }
    };
    window.addEventListener('notification.created', handleNotificationCreated);
    return () => {
      window.removeEventListener('notification.created', handleNotificationCreated);
    };
  }, []);

  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    try {
      await notificationService.markAsRead(notificationId);
      dispatch({
        type: 'MARK_READ',
        payload: {
          notificationId,
          readAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      throw normalizeApiError(error);
    }
  }, []);

  const markAllAsRead = useCallback(async (
    type?: 'order' | 'message' | 'promotion' | 'system'
  ): Promise<unknown> => {
    try {
      const result = await notificationService.markAllAsRead(type);
      dispatch({
        type: 'MARK_ALL_READ',
        payload: {
          type,
          readAt: new Date().toISOString(),
        },
      });
      return result.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string): Promise<void> => {
    try {
      await notificationService.deleteNotification(notificationId);
      dispatch({
        type: 'DELETE',
        payload: { notificationId },
      });
    } catch (error) {
      throw normalizeApiError(error);
    }
  }, []);

  return {
    notifications: state.data,
    data: state.data, // Standardized naming compatibility
    pagination: state.pagination,
    isLoading: state.isLoading,
    error: state.error,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

export function useUnreadCount(): UseUnreadCountReturn {
  const [state, dispatch] = useReducer(unreadCountReducer, {
    unreadCount: 0,
    isLoading: true,
    error: null,
  });

  const refresh = useCallback(() => {
    const abortController = new AbortController();

    dispatch({ type: 'FETCH_START' });

    notificationService
      .getUnreadCount({ signal: abortController.signal })
      .then((res) => {
        dispatch({
          type: 'FETCH_SUCCESS',
          payload: res.data.unreadCount,
        });
      })
      .catch((error: unknown) => {
        if (
          axios.isCancel(error) ||
          (error instanceof Error && error.name === 'CanceledError') ||
          (error as any)?.code === 'ERR_CANCELED'
        ) {
          return;
        }
        dispatch({
          type: 'FETCH_ERROR',
          error: normalizeApiError(error).message,
        });
      });

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    return refresh();
  }, [refresh]);

  useEffect(() => {
    const handleNotificationCreated = (event: Event) => {
      const notification = (event as CustomEvent).detail;
      console.info("🔔 [Real-time Log] useUnreadCount hook tăng số lượng chưa đọc (+1):", notification?.title);
      dispatch({ type: 'INCREMENT_COUNT' });
    };
    window.addEventListener('notification.created', handleNotificationCreated);
    return () => {
      window.removeEventListener('notification.created', handleNotificationCreated);
    };
  }, []);

  return {
    unreadCount: state.unreadCount,
    isLoading: state.isLoading,
    error: state.error,
    refresh,
  };
}