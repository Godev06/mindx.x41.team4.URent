import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Trash2,
  CheckCheck,
  MessageSquare,
  ShoppingBag,
  Gift,
  ShieldAlert,
  ArrowRight,
  Calendar,
  Sparkles
} from "lucide-react";
import { useTheme } from "../../settings/hooks/useTheme";
import { useI18n } from "../../shared/context/LanguageContext";
import { useNotifications } from "../hooks/useNotifications";
import { useUnreadCount } from "../hooks/useNotifications";

export function NotificationsPage() {
  const navigate = useNavigate();
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

  // Helper to map notification type to premium, themed icons
  const getNotificationIcon = (type: string) => {
    const baseClass =
      "p-2.5 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-sm";
    switch (type) {
      case "message":
        return theme === "dark" ? (
          <div className={`${baseClass} bg-teal-500/10 text-teal-400 border border-teal-500/20`}>
            <MessageSquare size={18} />
          </div>
        ) : (
          <div className={`${baseClass} bg-teal-50 text-teal-600 border border-teal-100`}>
            <MessageSquare size={18} />
          </div>
        );
      case "order":
        return theme === "dark" ? (
          <div className={`${baseClass} bg-blue-500/10 text-blue-400 border border-blue-500/20`}>
            <ShoppingBag size={18} />
          </div>
        ) : (
          <div className={`${baseClass} bg-blue-50 text-blue-600 border border-blue-100`}>
            <ShoppingBag size={18} />
          </div>
        );
      case "promotion":
        return theme === "dark" ? (
          <div className={`${baseClass} bg-purple-500/10 text-purple-400 border border-purple-500/20`}>
            <Gift size={18} />
          </div>
        ) : (
          <div className={`${baseClass} bg-purple-50 text-purple-600 border border-purple-100`}>
            <Gift size={18} />
          </div>
        );
      default:
        return theme === "dark" ? (
          <div className={`${baseClass} bg-amber-500/10 text-amber-400 border border-amber-500/20`}>
            <ShieldAlert size={18} />
          </div>
        ) : (
          <div className={`${baseClass} bg-amber-50 text-amber-600 border border-amber-100`}>
            <ShieldAlert size={18} />
          </div>
        );
    }
  };

  // Helper to map notification type to premium, themed labels
  const getCategoryLabel = (type: string) => {
    switch (type) {
      case "message":
        return t.headerMessages || "Tin nhắn";
      case "order":
        return t.ordersTitle || "Đơn hàng";
      case "promotion":
        return "Khuyến mãi";
      default:
        return "Hệ thống";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-teal-500/20 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-teal-500 animate-spin"></div>
          </div>
          <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            Loading notifications...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-sm p-6 rounded-3xl border border-red-500/10 bg-red-500/5">
          <ShieldAlert size={40} className="text-red-500 mx-auto mb-3" />
          <h3 className={`text-base font-semibold ${theme === "dark" ? "text-slate-200" : "text-slate-900"}`}>
            Không thể tải thông báo
          </h3>
          <p className="mt-1 text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 sm:px-4 py-2">
      {/* Premium Glassmorphic Header */}
      <div
        className={`relative overflow-hidden rounded-3xl border px-6 py-6 shadow-xl backdrop-blur-md transition-all duration-300 ${theme === "dark"
            ? "border-slate-800 bg-slate-900/80 ring-1 ring-white/5"
            : "border-slate-200 bg-white/90 ring-1 ring-slate-900/5"
          }`}
      >
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-teal-500/10 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1
                className={`text-2xl font-bold tracking-tight ${theme === "dark"
                    ? "bg-gradient-to-r from-slate-50 via-slate-100 to-slate-300 bg-clip-text text-transparent"
                    : "text-slate-900"
                  }`}
              >
                {t.notifCenterTitle}
              </h1>
              <Sparkles size={18} className="text-teal-500 animate-pulse" />
            </div>
            <p
              className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"
                }`}
            >
              {t.notifCenterDesc}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-300 ${theme === "dark"
                  ? "bg-teal-500/15 text-teal-300 border border-teal-500/20"
                  : "bg-teal-50 text-teal-700 border border-teal-100"
                }`}
            >
              <Bell size={15} strokeWidth={2.5} className="animate-swing" />
              <span>
                {unreadCount} {t.notifCenterCount}
              </span>
            </div>

            <button
              onClick={handleMarkAllAsRead}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-sm ${theme === "dark"
                  ? "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white"
                  : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                }`}
            >
              <CheckCheck size={16} strokeWidth={2.5} className="text-teal-500" />
              <span>Mark All Read</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row items-stretch">
        {/* Left Pane - Notification List */}
        <div
          className={`w-full lg:w-[420px] shrink-0 overflow-hidden rounded-3xl border shadow-xl backdrop-blur-sm transition-all duration-300 ${theme === "dark"
              ? "border-slate-800 bg-slate-900/50 ring-1 ring-white/5"
              : "border-slate-200 bg-white/70 ring-1 ring-slate-900/5"
            }`}
        >
          <div
            className={`px-5 py-4 border-b ${theme === "dark" ? "border-slate-800" : "border-slate-200"
              }`}
          >
            <h2
              className={`text-sm font-bold tracking-wide uppercase ${theme === "dark" ? "text-slate-400" : "text-slate-500"
                }`}
            >
              {t.notifCenterListTitle}
            </h2>
            <p
              className={`mt-0.5 text-xs ${theme === "dark" ? "text-slate-500" : "text-slate-400"
                }`}
            >
              {t.notifCenterListDesc}
            </p>
          </div>

          <div
            className={`divide-y max-h-[520px] overflow-y-auto custom-scrollbar ${theme === "dark" ? "divide-slate-800/60" : "divide-slate-100"
              }`}
          >
            {notifications.map((notification) => {
              const isSelected = selectedNotificationId === notification._id;
              const isUnread = !notification.read;

              return (
                <div
                  key={notification._id}
                  className={`group relative px-5 py-4 transition-all duration-300 cursor-pointer flex gap-4 items-start ${isSelected
                      ? theme === "dark"
                        ? "bg-teal-500/5 border-l-4 border-l-teal-500"
                        : "bg-teal-50/40 border-l-4 border-l-teal-600"
                      : "border-l-4 border-l-transparent hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    }`}
                  onClick={() => setSelectedNotificationId(notification._id)}
                >
                  {/* Category Themed Icon */}
                  {getNotificationIcon(notification.type)}

                  {/* Text Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${notification.type === "message"
                            ? "text-teal-500"
                            : notification.type === "order"
                              ? "text-blue-500"
                              : "text-purple-500"
                          }`}
                      >
                        {getCategoryLabel(notification.type)}
                      </span>
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex items-center gap-1 text-[11px] font-medium ${theme === "dark" ? "text-slate-500" : "text-slate-400"
                            }`}
                        >
                          <Calendar size={10} />
                          <span>
                            {notification.time ||
                              new Date(notification.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {isUnread && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                          </span>
                        )}
                      </div>
                    </div>

                    <h3
                      className={`text-sm font-semibold truncate leading-snug transition-colors duration-200 ${isSelected
                          ? "text-teal-600 dark:text-teal-400 font-bold"
                          : theme === "dark"
                            ? "text-slate-100"
                            : "text-slate-800"
                        }`}
                    >
                      {notification.title}
                    </h3>
                    <p
                      className={`text-xs line-clamp-1 leading-normal ${theme === "dark" ? "text-slate-400" : "text-slate-500"
                        }`}
                    >
                      {notification.description}
                    </p>
                  </div>

                  {/* Absolute positioned Action Buttons */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification._id);
                    }}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 ${theme === "dark"
                        ? "hover:bg-red-500/10 text-red-400 hover:text-red-300"
                        : "hover:bg-red-50 text-red-500 hover:text-red-600"
                      }`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}

            {notifications.length === 0 && (
              <div className="px-5 py-12 text-center space-y-3">
                <Bell size={32} className="text-slate-400 mx-auto opacity-40" />
                <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                  No notifications yet
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane - Rich Detailed Card Panel */}
        <div
          className={`flex-1 rounded-3xl border shadow-xl backdrop-blur-sm transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${theme === "dark"
              ? "border-slate-800 bg-slate-900/30 ring-1 ring-white/5"
              : "border-slate-200 bg-white/50 ring-1 ring-slate-900/5"
            }`}
        >
          {/* Decorative mesh gradient overlay inside Detail pane */}
          <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/5 via-transparent to-transparent pointer-events-none"></div>

          {selectedNotification ? (
            <div className="relative p-8 flex flex-col justify-between h-full space-y-8 z-10">
              {/* Header Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${theme === "dark"
                        ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                        : "bg-teal-50 text-teal-700 border border-teal-100"
                      }`}
                  >
                    {getCategoryLabel(selectedNotification.type)}
                  </span>
                  <p className={`mt-2 text-xs font-medium flex items-center gap-1 ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                    <Calendar size={12} />
                    <span>
                      {selectedNotification.time ||
                        new Date(selectedNotification.createdAt).toLocaleDateString() +
                        " - " +
                        new Date(selectedNotification.createdAt).toLocaleTimeString()}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!selectedNotification.read && (
                    <button
                      onClick={() => handleMarkAsRead(selectedNotification._id)}
                      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all duration-200 shadow-sm hover:-translate-y-0.5 active:translate-y-0 ${theme === "dark"
                          ? "bg-teal-500/10 text-teal-300 border border-teal-500/25 hover:bg-teal-500/20"
                          : "bg-teal-50 text-teal-700 border border-teal-100 hover:bg-teal-100"
                        }`}
                    >
                      <CheckCheck size={14} strokeWidth={2.5} />
                      <span>Mark as Read</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(selectedNotification._id)}
                    className={`p-2.5 rounded-2xl transition-all duration-200 border shadow-sm hover:-translate-y-0.5 active:translate-y-0 ${theme === "dark"
                        ? "bg-slate-800 text-red-400 border-slate-700 hover:bg-red-500/10 hover:border-red-500/20"
                        : "bg-white text-red-500 border-slate-200 hover:bg-red-50 hover:border-red-100"
                      }`}
                    title="Delete notification"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Rich Body Content */}
              <div className="flex-1 space-y-6 py-4">
                <div className="space-y-3">
                  <span className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                    Tiêu đề thông báo
                  </span>
                  <h2
                    className={`text-xl font-bold tracking-tight leading-snug ${theme === "dark" ? "text-slate-100" : "text-slate-900"
                      }`}
                  >
                    {selectedNotification.title}
                  </h2>
                </div>

                <div className="space-y-3">
                  <span className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                    Nội dung chi tiết
                  </span>
                  <div
                    className={`p-5 rounded-2xl border text-sm leading-relaxed ${theme === "dark"
                        ? "bg-slate-900/60 border-slate-800 text-slate-300"
                        : "bg-slate-50 border-slate-150 text-slate-700"
                      }`}
                  >
                    {selectedNotification.description}
                  </div>
                </div>
              </div>

              {/* Dynamic Footer Call to Action Button */}
              {selectedNotification.actionUrl && (
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6">
                  <button
                    onClick={() => navigate(selectedNotification.actionUrl!)}
                    className={`group inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold shadow-lg shadow-teal-500/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-teal-500/20 active:translate-y-0 ${theme === "dark"
                        ? "bg-teal-500 text-slate-950 hover:bg-teal-400 active:bg-teal-600"
                        : "bg-teal-600 text-white hover:bg-teal-500 active:bg-teal-700"
                      }`}
                  >
                    <span>{t.ordersViewDetail ? "Xem chi tiết" : "View Details"}</span>
                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Elegant and Animated Empty Placeholder State */
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-teal-500/10 blur-xl animate-pulse"></div>
                <div className="relative p-6 rounded-full bg-gradient-to-b from-teal-500/5 to-teal-500/10 border border-teal-500/20 text-teal-500 animate-bounce">
                  <Bell size={40} strokeWidth={1.5} />
                </div>
              </div>
              <div className="max-w-xs space-y-1.5">
                <h3 className={`text-base font-bold tracking-tight ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}>
                  {t.notifCenterDetailTitle || "Chi tiết thông báo"}
                </h3>
                <p className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                  {t.notifCenterDetailDesc || "Chọn một thông báo ở danh sách bên trái để bắt đầu xem chi tiết nội dung."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
