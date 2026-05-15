import { useState } from "react";
import { Bell, Trash2, CheckCheck } from "lucide-react";
import { useTheme } from "../../settings/hooks/useTheme";
import { useI18n } from "../../shared/context/LanguageContext";
import { useNotifications } from "../hooks/useNotifications";
import { useUnreadCount } from "../hooks/useNotifications";

export function NotificationsPage() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const {
    notifications,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({ limit: 20 });
  const { unreadCount } = useUnreadCount();
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    string | null
  >(null);

  const selectedNotification =
    notifications.find((item) => item._id === selectedNotificationId) ||
    notifications[0];

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      if (selectedNotificationId === id) {
        setSelectedNotificationId(null);
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={`rounded-2xl border px-5 py-4 shadow-sm ring-1 ${
          theme === "dark"
            ? "border-slate-700 bg-slate-900 ring-white/10"
            : "border-slate-200/90 bg-white ring-slate-900/4"
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className={`text-xl font-semibold tracking-tight ${
                theme === "dark" ? "text-slate-100" : "text-slate-900"
              }`}
            >
              {t.notifCenterTitle}
            </h1>
            <p
              className={`mt-1 text-sm ${
                theme === "dark" ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {t.notifCenterDesc}
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium ${
              theme === "dark"
                ? "bg-teal-500/15 text-teal-300"
                : "bg-teal-50 text-teal-700"
            }`}
          >
            <Bell size={16} strokeWidth={2} />
            {unreadCount} {t.notifCenterCount}
          </div>
          <button
            onClick={handleMarkAllAsRead}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
              theme === "dark"
                ? "bg-blue-500/15 text-blue-300 hover:bg-blue-500/25"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            <CheckCheck size={16} strokeWidth={2} />
            Mark All Read
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div
          className={`min-w-full overflow-hidden rounded-3xl border shadow-sm ring-1 lg:min-w-88 ${
            theme === "dark"
              ? "border-slate-700 bg-slate-900 ring-white/10"
              : "border-slate-200/90 bg-white ring-slate-900/4"
          }`}
        >
          <div
            className={`px-5 py-4 ${
              theme === "dark"
                ? "border-b border-slate-700"
                : "border-b border-slate-200/90"
            }`}
          >
            <h2
              className={`text-sm font-semibold ${
                theme === "dark" ? "text-slate-100" : "text-slate-900"
              }`}
            >
              {t.notifCenterListTitle}
            </h2>
            <p
              className={`mt-1 text-xs ${
                theme === "dark" ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {t.notifCenterListDesc}
            </p>
          </div>
          <div
            className={`divide-y ${theme === "dark" ? "divide-slate-800" : "divide-slate-100"}`}
          >
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`group relative px-5 py-4 transition ${
                  selectedNotificationId === notification._id
                    ? theme === "dark"
                      ? "bg-slate-800/80"
                      : "bg-slate-50"
                    : theme === "dark"
                      ? "hover:bg-slate-800/50"
                      : "hover:bg-slate-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedNotificationId(notification._id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div
                      className={`text-sm font-medium ${
                        theme === "dark" ? "text-slate-100" : "text-slate-900"
                      }`}
                    >
                      {notification.title}
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                      >
                        {notification.time ||
                          new Date(notification.createdAt).toLocaleDateString()}
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleDelete(notification._id)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                    theme === "dark"
                      ? "hover:bg-red-500/20 text-red-400"
                      : "hover:bg-red-50 text-red-500"
                  }`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p
                  className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                >
                  No notifications yet
                </p>
              </div>
            )}
          </div>
        </div>

        <div
          className={`flex-1 rounded-3xl border p-6 shadow-sm ring-1 ${
            theme === "dark"
              ? "border-slate-700 bg-slate-900 ring-white/10"
              : "border-slate-200/90 bg-white ring-slate-900/4"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p
                className={`text-sm font-semibold ${
                  theme === "dark" ? "text-slate-100" : "text-slate-900"
                }`}
              >
                {t.notifCenterDetailTitle}
              </p>
              <p
                className={`mt-1 text-xs ${
                  theme === "dark" ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {t.notifCenterDetailDesc}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                theme === "dark"
                  ? "bg-teal-500/15 text-teal-300"
                  : "bg-teal-100 text-teal-700"
              }`}
            >
              {selectedNotification?.time ||
                (selectedNotification
                  ? new Date(
                      selectedNotification.createdAt,
                    ).toLocaleDateString()
                  : "")}
            </span>
            {selectedNotification && !selectedNotification.read && (
              <button
                onClick={() => handleMarkAsRead(selectedNotification._id)}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
                  theme === "dark"
                    ? "bg-green-500/15 text-green-300 hover:bg-green-500/25"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                <CheckCheck size={16} strokeWidth={2} />
                Mark as Read
              </button>
            )}
          </div>

          <div className="mt-6">
            <h2
              className={`text-lg font-semibold ${
                theme === "dark" ? "text-slate-100" : "text-slate-900"
              }`}
            >
              {selectedNotification?.title || "No notification selected"}
            </h2>
            <p
              className={`mt-4 text-sm leading-7 ${
                theme === "dark" ? "text-slate-300" : "text-slate-600"
              }`}
            >
              {selectedNotification?.description ||
                "Select a notification to view details"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
