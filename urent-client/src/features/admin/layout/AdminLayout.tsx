import type { ReactNode } from "react";
import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../user/auth/hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Activity,
  LogOut,
  Home,
  Bell,
  Search,
  UserCheck,
  MessageSquare,
  Megaphone,
  CheckCheck
} from "lucide-react";
import { useNotifications, useUnreadCount } from "../../user/notifications/hooks/useNotifications";
import { useToast } from "../../user/shared/hooks/useToast";
import { audioChimeService } from "../../user/notifications/services/audioChimeService";

interface Props {
  children: ReactNode;
}

export function AdminLayout({ children }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const adminName = user?.displayName || user?.username || "System Admin";
  const initials = adminName.substring(0, 2).toUpperCase();

  // Notification States & Hooks
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const { notifications, markAsRead, markAllAsRead } = useNotifications({ limit: 5 });
  const { unreadCount, refresh: refreshUnread } = useUnreadCount();
  const { showToast } = useToast();

  // Click Outside Notification Dropdown Listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on navigation
  useEffect(() => {
    setIsNotifOpen(false);
  }, [location.pathname]);

  // WebSocket Live Notification Listener
  useEffect(() => {
    if (!user) return;

    const handleNotificationCreated = (event: Event) => {
      const notification = (event as CustomEvent).detail;
      if (!notification) return;

      console.info("🔔 [Real-time Log] AdminLayout nhận sự kiện thông báo qua WebSockets:", notification);

      // Play sound if enabled
      const isSoundEnabled = localStorage.getItem("settings.soundNotifications") !== "false";
      if (isSoundEnabled) {
        audioChimeService.playChime();
      }

      // Show high-end dynamic toast
      showToast({
        title: notification.title,
        description: notification.description,
        variant: "info",
        actionUrl: notification.actionUrl,
      });

      // Browser Desktop Notification
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          const nativeNotif = new Notification(notification.title, {
            body: notification.description,
            icon: "/urent.png",
            tag: notification._id,
          });

          nativeNotif.onclick = (e) => {
            e.preventDefault();
            window.focus();
            if (notification.actionUrl) {
              navigate(notification.actionUrl);
            }
            nativeNotif.close();
          };
        } catch (err) {
          console.warn("[NativeNotification] Failed to play native chime:", err);
        }
      }
    };

    window.addEventListener("notification.created", handleNotificationCreated);
    return () => {
      window.removeEventListener("notification.created", handleNotificationCreated);
    };
  }, [user, showToast, navigate]);

  const handleNotificationItemClick = async (notifId: string, actionUrl?: string) => {
    try {
      await markAsRead(notifId);
      refreshUnread();
      if (actionUrl) {
        navigate(actionUrl);
      }
      setIsNotifOpen(false);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      refreshUnread();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="h-4.5 w-4.5 text-cyan-400" />;
      case "message":
        return <MessageSquare className="h-4.5 w-4.5 text-teal-400" />;
      case "promotion":
        return <Megaphone className="h-4.5 w-4.5 text-amber-400" />;
      case "system":
      default:
        return <Activity className="h-4.5 w-4.5 text-rose-400" />;
    }
  };

  const getNotificationIconBg = (type: string) => {
    switch (type) {
      case "order":
        return "bg-cyan-500/10 border-cyan-500/20";
      case "message":
        return "bg-teal-500/10 border-teal-500/20";
      case "promotion":
        return "bg-amber-500/10 border-amber-500/20";
      case "system":
      default:
        return "bg-rose-500/10 border-rose-500/20";
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " " + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Users", path: "/admin/users", icon: Users },
    { label: "Orders", path: "/admin/orders", icon: ShoppingBag },
    { label: "Chat", path: "/admin/chat", icon: MessageSquare },
    { label: "Broadcast", path: "/admin/broadcast", icon: Megaphone },
    { label: "Logs", path: "/admin/logs", icon: Activity },
  ];

  const handleLogout = () => {
    logout({ redirectTo: "/login" });
  };

  const navItem = (label: string, path: string) => {
    const item = menuItems.find((m) => m.path === path);
    const Icon = item ? item.icon : LayoutDashboard;
    const active = isActive(path);

    return (
      <button
        key={path}
        onClick={() => navigate(path)}
        className={`group flex w-full items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 border ${
          active
            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-lg shadow-cyan-500/5"
            : "text-slate-400 border-transparent hover:text-white hover:bg-white/[0.02]"
        }`}
      >
        <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
          active ? "text-cyan-400" : "text-slate-400 group-hover:text-white"
        }`} />
        {label}
      </button>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#070b19] font-sans text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-72 flex-col border-r border-slate-800/80 bg-[#0b1329]/95 backdrop-blur-xl px-6 py-8">
        {/* LOGO */}
        <div className="flex items-center gap-3.5 px-2">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-400 to-cyan-500 shadow-lg shadow-cyan-500/10">
            <img src="/urent.png" alt="logo" className="h-6.5 w-6.5 object-contain" />
            <div className="absolute -inset-0.5 -z-10 animate-pulse rounded-2xl bg-cyan-400 opacity-20 blur-sm"></div>
          </div>

          <div>
            <p className="text-lg font-bold tracking-tight text-white">U-Rent</p>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              ADMIN SPACE
            </p>
          </div>
        </div>
        <nav className="flex flex-col gap-2 mt-4">
          {navItem("Dashboard", "/admin")}
          {navItem("Users", "/admin/users")}
          {navItem("Orders", "/admin/orders")}
          {navItem("Chat", "/admin/chat")}
          {navItem("Logs", "/admin/logs")}
        </nav>

        {/* FOOTER & LOGOUT */}
        <div className="mt-auto flex flex-col gap-5 pt-8 border-t border-slate-800/80">
          <button
            onClick={() => navigate("/")}
            className="group flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.02] transition duration-200"
          >
            <Home className="h-4 w-4 text-slate-500 group-hover:text-white transition duration-200" />
            Back to Client Shop
          </button>

          <button
            onClick={handleLogout}
            className="group flex w-full items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-all duration-300 border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="h-5 w-5 text-rose-400 group-hover:translate-x-0.5 transition-transform duration-200" />
            Sign Out
          </button>
          <div className="px-2 text-[10px] font-medium text-slate-600">
            © 2026 U-Rent Systems. All rights reserved.
          </div>
        </div>
      </aside>

      {/* MAIN SHELL */}
      <div className="flex flex-1 flex-col pl-72">
        {/* STICKY TOP HEADER */}
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-800/60 bg-[#070b19]/80 backdrop-blur-md px-10">
          {/* SEARCH BAR ELEMENT MOCK */}
          <div className="relative flex w-80 items-center">
            <Search className="absolute left-3.5 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-300 placeholder:text-slate-600 focus:border-cyan-500/40 focus:bg-slate-900 focus:outline-none transition duration-300"
              disabled
            />
          </div>

          {/* QUICK CONTROLS & USER PROFILE */}
          <div className="flex items-center gap-6">
            {/* NOTIFICATIONS BAR */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition duration-300 ${
                  isNotifOpen
                    ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/5"
                    : "border-slate-800/80 bg-slate-900/30 text-slate-400 hover:text-white hover:bg-slate-900/80"
                }`}
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 z-50 mt-3 w-[26rem] overflow-hidden rounded-[1.75rem] border border-slate-800 bg-[#0b1329]/95 backdrop-blur-xl text-slate-100 shadow-[0_24px_70px_-28px_rgba(2,8,23,0.9)] ring-1 ring-white/10 animate-in fade-in slide-in-from-top-3 duration-200">
                  {/* Dropdown Header */}
                  <div className="border-b border-slate-800/80 bg-gradient-to-br from-cyan-950/20 via-[#0b1329] to-teal-950/20 px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white flex items-center gap-2">
                          <Bell className="h-4 w-4 text-cyan-400" />
                          Thông báo hệ thống
                        </p>
                        <p className="mt-1 text-[11px] font-medium text-slate-400">
                          Bạn có {unreadCount} thông báo chưa đọc
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="flex items-center gap-1 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 transition duration-150 py-1.5 px-2.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/10"
                        >
                          <CheckCheck className="h-3 w-3" />
                          Tất cả đã đọc
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dropdown Content */}
                  <div className="max-h-96 overflow-y-auto p-3 space-y-2">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <button
                          key={notification._id}
                          onClick={() => handleNotificationItemClick(notification._id, notification.actionUrl)}
                          className={`group relative w-full overflow-hidden rounded-2xl border text-left p-4 transition-all duration-200 flex items-start gap-3.5 hover:scale-[1.01] ${
                            !notification.read
                              ? "bg-slate-900/60 border-slate-800 hover:border-cyan-500/30 hover:bg-slate-900"
                              : "bg-[#0b1329] border-transparent hover:bg-white/[0.02]"
                          }`}
                        >
                          {/* Left Accent Bar for Unread */}
                          {!notification.read && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-teal-500" />
                          )}

                          {/* Icon Container */}
                          <div className={`flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl border ${getNotificationIconBg(notification.type)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Text Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-xs font-bold leading-snug truncate ${
                                !notification.read ? "text-slate-100" : "text-slate-400"
                              }`}>
                                {notification.title}
                              </p>
                              <span className="shrink-0 text-[9px] font-semibold text-slate-500">
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-slate-400 line-clamp-2">
                              {notification.description}
                            </p>
                            {!notification.read && (
                              <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-cyan-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                <span>Chưa đọc</span>
                              </div>
                            )}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2.5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/50 border border-slate-800 text-slate-600">
                          <Bell className="h-5 w-5" />
                        </div>
                        <p>Không có thông báo nào dành cho bạn</p>
                      </div>
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div className="border-t border-slate-800/80 bg-slate-950/40 p-3 flex gap-2">
                    <button
                      onClick={() => {
                        setIsNotifOpen(false);
                        navigate("/notifications");
                      }}
                      className="flex-1 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 py-2.5 text-xs font-semibold text-slate-300 transition duration-150 hover:bg-slate-800"
                    >
                      Hộp thư thông báo
                    </button>
                    <button
                      onClick={() => {
                        setIsNotifOpen(false);
                        navigate("/admin/broadcast");
                      }}
                      className="flex-1 flex items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-900/20 transition duration-150"
                    >
                      Phát sóng (Broadcast)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* VERTICAL DIVIDER */}
            <div className="h-6 w-[1px] bg-slate-800" />

            {/* USER ACC INFO */}
            <div className="flex items-center gap-3">
              {user?.avatarUrl && /^(https?:\/\/|\/).+/.test(user.avatarUrl) ? (
                <img
                  src={user.avatarUrl}
                  alt={adminName}
                  className="h-10 w-10 shrink-0 rounded-xl object-cover border border-cyan-500/30 shadow-inner"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500/20 to-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold text-sm">
                  {initials}
                </div>
              )}
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-slate-100">{adminName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <UserCheck className="h-3 w-3 text-teal-400" />
                  <p className="text-[10px] font-medium text-slate-400 capitalize">{user?.role || "Admin"}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* CONTAINER CONTENT */}
        <main className="flex-1 p-10 max-w-8xl">
          {children}
        </main>
      </div>
    </div>
  );
}
