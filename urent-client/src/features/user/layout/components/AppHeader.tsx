import {
  Bell,
  LogOut,
  Search,
  Settings,
  ShoppingCart,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../auth/constants";
import { useAuthGate } from "../../auth/context/AuthGateContext";
import { useAuth } from "../../auth/hooks/useAuth";
import { SidebarItem } from "../../shared/components/SidebarItem";
import { useI18n } from "../../shared/context/LanguageContext";
import { getAvatarStyle } from "../../shared/utils/avatar";
import { useNotifications, useUnreadCount } from "../../notifications/hooks/useNotifications";
import { useToast } from "../../shared/hooks/useToast";
import { MAIN_NAV_ITEMS } from "../constants/navItems";
import { audioChimeService } from "../../notifications/services/audioChimeService";

interface ProfileMenuItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  isDanger?: boolean;
}



export function AppHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { guardedNavigate } = useAuthGate();
  const { t } = useI18n();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { notifications } = useNotifications({ limit: 3 });
  const { unreadCount } = useUnreadCount();
  const { showToast } = useToast();

  // 1. Tự động đăng ký Service Worker và đồng bộ FCM Token khi đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      if ("serviceWorker" in navigator) {
        const firebaseConfig = {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
          appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
        };

        // Chuyển cấu hình làm query params động cho Service Worker
        const queryParams = new URLSearchParams(firebaseConfig as any).toString();

        navigator.serviceWorker
          .register(`/firebase-messaging-sw.js?${queryParams}`)
          .then((reg) => {
            console.log("[FCM SW] Service Worker registered successfully:", reg);
            // Lấy token thiết bị
            import("../../notifications/services/fcm").then(({ fcmService }) => {
              fcmService.requestPermissionAndGetToken();
            });
          })
          .catch((err) => {
            console.error("[FCM SW] Service Worker registration failed:", err);
          });
      }
    } else {
      // Hủy token thiết bị khi đăng xuất
      import("../../notifications/services/fcm").then(({ fcmService }) => {
        fcmService.revokeToken();
      });
    }
  }, [isAuthenticated]);

  // 2. Lắng nghe sự kiện thông báo thời gian thực để kích hoạt Chuông báo & Toast nổi
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNotificationCreated = (event: Event) => {
      const notification = (event as CustomEvent).detail;
      if (!notification) return;

      console.info("🔔 [Real-time Log] AppHeader nhận sự kiện thông báo qua WebSockets:", notification);

      // Phát âm thanh thông báo sử dụng AudioChimeService (nếu người dùng bật)
      const isSoundEnabled = localStorage.getItem("settings.soundNotifications") !== "false";
      if (isSoundEnabled) {
        audioChimeService.playChime();
      }

      // Kích hoạt Toast thông báo cao cấp có hỗ trợ deep-link
      showToast({
        title: notification.title,
        description: notification.description,
        variant: "info",
        actionUrl: notification.actionUrl,
      });

      // Phát thông báo Native của hệ điều hành (Browser Desktop Notification)
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
  }, [isAuthenticated, showToast, navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsNotifOpen(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdowns when the route changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setIsNotifOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  const navLabelMap: Record<string, string> = {
    "/": t.headerHome,
    "/orders": t.headerOrders,
    "/inventory": t.headerInventory,
    "/messages": t.headerMessages,
  };

  const profileMenuItems: ProfileMenuItem[] = [
    {
      label: t.headerProfile,
      icon: User,
      onClick: () => {
        navigate(APP_ROUTES.profile);
        setIsProfileOpen(false);
      },
    },
    {
      label: t.headerSettingsAria,
      icon: Settings,
      onClick: () => {
        navigate("/settings");
        setIsProfileOpen(false);
      },
    },
    {
      label: t.headerMyOrders,
      icon: ShoppingCart,
      onClick: () => {
        navigate("/orders");
        setIsProfileOpen(false);
      },
    },
    {
      label: t.headerLogout,
      icon: LogOut,
      onClick: () => {
        setIsProfileOpen(false);
        logout();
      },
      isDanger: true,
    },
  ];

  const displayName = user?.displayName ?? user?.email ?? t.headerUserFallback;
  const { initials, colorClass } = getAvatarStyle(displayName);
  const isSettingsPage = pathname.startsWith("/settings");
  const isNotificationsPage = pathname.startsWith("/notifications");
  const supportsSearch = ["/", "/orders", "/inventory", "/products"].some(
    (p) => (p === "/" ? pathname === "/" : pathname.startsWith(p)),
  );
  const handleNotificationClick = () => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setIsNotifOpen(false);
      setIsProfileOpen(false);
      navigate("/notifications");
      return;
    }

    setIsNotifOpen((open) => !open);
  };
  const isMobilePanelOpen = isNotifOpen || isProfileOpen;

  return (
    <nav className="sticky top-0 z-50 rounded-3xl border border-white/65 bg-white/85 px-4 py-3 shadow-[0_14px_44px_-20px_rgba(15,23,42,0.34)] ring-1 ring-white/70 backdrop-blur-2xl sm:px-5 lg:px-6 dark:border-white/14 dark:bg-[#0b1220]/78 dark:shadow-[0_22px_58px_-26px_rgba(2,8,23,0.9)] dark:ring-white/10">
      {isMobilePanelOpen ? (
        <button
          type="button"
          aria-label="Close panel"
          className="fixed inset-0 z-30 bg-slate-950/25 backdrop-blur-[1px] lg:hidden"
          onClick={() => {
            setIsNotifOpen(false);
            setIsProfileOpen(false);
          }}
        />
      ) : null}
      <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 md:gap-4 lg:flex-nowrap lg:gap-6 xl:gap-8">
        <div className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate(APP_ROUTES.home)}
            aria-label={t.headerHomeAria}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-teal-400 to-cyan-500 shadow-lg shadow-teal-900/30"
          >
            <img
              src="/urent.png"
              alt="U-Rent"
              className="h-7 w-7 object-contain"
            />
          </button>
          <button
            type="button"
            onClick={() => navigate(APP_ROUTES.home)}
            className="min-w-0 text-left"
          >
            <h1 className="truncate bg-linear-to-r from-slate-800 to-slate-600 bg-clip-text text-base leading-tight font-bold text-transparent sm:text-lg md:text-xl dark:from-white dark:to-slate-300">
              U-Rent
            </h1>
            <p className="hidden text-[9px] sm:text-[10px] font-semibold tracking-widest text-slate-400 uppercase sm:block dark:text-slate-500">
              Workspace
            </p>
          </button>
        </div>

        {supportsSearch && (
          <div className="relative hidden max-w-xl flex-1 lg:flex">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors dark:text-slate-500"
              size={16}
              strokeWidth={2}
            />
            <input
              type="search"
              placeholder={t.headerSearchPlaceholder}
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-400/40"
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3 lg:gap-4">
          <div className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-1.5 lg:flex dark:border-white/8 dark:bg-white/4">
            {MAIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.isActive(pathname);

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => guardedNavigate(item.path)}
                  className={`flex items-center gap-2 rounded-full px-3.5 py-2 transition-all duration-200 lg:px-4.5 ${
                    isActive
                      ? "bg-teal-600 font-semibold text-white shadow-sm dark:bg-white dark:text-slate-900"
                      : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/6 dark:hover:text-slate-100"
                  }`}
                >
                  <Icon size={18} strokeWidth={2} />
                  <span className="hidden text-sm xl:block">
                    {navLabelMap[item.path] ?? item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 border-l border-slate-200 pl-2.5 sm:gap-3.5 sm:pl-4.5 dark:border-white/10">
            {isAuthenticated ? (
              <>
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    className={`relative rounded-xl p-2.5 transition sm:p-2 ${
                      isNotificationsPage || isNotifOpen
                        ? "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"
                        : "text-slate-500 hover:bg-slate-100 hover:text-teal-600 dark:text-slate-400 dark:hover:bg-white/6 dark:hover:text-teal-300"
                    }`}
                    aria-label={t.headerNotificationsAria}
                    aria-expanded={isNotifOpen}
                    onClick={handleNotificationClick}
                  >
                    <Bell size={20} strokeWidth={2} />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full border-2 border-white bg-red-500 dark:border-[#0b1220]" />
                    )}
                  </button>

                  {isNotifOpen && (
                    <div className="absolute right-0 z-20 mt-3 hidden w-92 overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white text-slate-800 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/5 dark:border-white/10 dark:bg-[#101a2a] dark:text-slate-100 dark:ring-black lg:block">
                      <div className="border-b border-slate-100 bg-linear-to-br from-teal-50 via-white to-cyan-50 px-4 py-4 dark:border-white/10 dark:from-teal-500/10 dark:via-[#101a2a] dark:to-cyan-500/10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-base font-semibold text-slate-900 dark:text-white lg:text-sm">
                              {t.headerNotificationsTitle}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400 lg:text-xs lg:leading-5">
                              {t.headerNotificationsSubtitle}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white shadow-sm dark:bg-white dark:text-slate-900 lg:px-2.5 lg:text-[11px]">
                            {unreadCount}
                          </span>
                        </div>
                      </div>

                      <div className="max-h-80 space-y-2 overflow-y-auto p-2.5">
                        {notifications.length > 0 ? (
                          notifications.slice(0, 3).map((notification) => (
                            <button
                              key={notification._id}
                              type="button"
                              className="group relative w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left transition hover:border-teal-200 hover:bg-white hover:shadow-sm dark:border-white/8 dark:bg-white/4 dark:hover:border-teal-400/20 dark:hover:bg-white/6"
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                                  <Bell size={16} strokeWidth={2.2} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="line-clamp-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                                          {notification.title}
                                        </p>
                                        {!notification.read ? (
                                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                                            {t.headerNotificationsBadge}
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                    <span className="shrink-0 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                      {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <div className="mt-2 flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                    <span className={`h-2 w-2 rounded-full ${notification.read ? 'bg-gray-400' : 'bg-emerald-400'}`} />
                                    <span>{notification.read ? 'Đã đọc' : t.headerNotificationsHint}</span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                            Không có thông báo mới nào
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-100 bg-slate-50/80 px-3 py-3 dark:border-white/10 dark:bg-white/3">
                        <button
                          type="button"
                          className="flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                          onClick={() => {
                            setIsNotifOpen(false);
                            navigate("/notifications");
                          }}
                        >
                          {t.headerViewAll}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className={`hidden rounded-xl p-2 transition lg:inline-flex ${
                    isSettingsPage
                      ? "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/6 dark:hover:text-slate-100"
                  }`}
                  aria-label={t.headerSettingsAria}
                  onClick={() => navigate("/settings")}
                >
                  <Settings size={20} strokeWidth={2} />
                </button>

                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1.5 pr-2.5 transition-all hover:border-slate-300 hover:bg-slate-100 sm:gap-2.5 sm:pr-4 dark:border-white/12 dark:bg-white/5 dark:hover:border-white/25 dark:hover:bg-white/8"
                    onClick={() => setIsProfileOpen((open) => !open)}
                    aria-label={t.headerProfileMenuAria}
                    aria-expanded={isProfileOpen}
                  >
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={displayName}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-inner ${colorClass}`}
                      >
                        {initials}
                      </div>
                    )}
                    <div className="hidden text-left lg:block">
                      <p className="text-xs font-semibold text-slate-800 dark:text-white">
                        {displayName}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        {user?.email ?? ""}
                      </p>
                    </div>
                  </button>

                  {isProfileOpen && (
                    <div className="fixed inset-x-3 top-23 z-40 overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_24px_70px_-28px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/5 dark:border-white/10 dark:bg-[#101a2a] dark:ring-black/40 sm:top-28 lg:absolute lg:inset-x-auto lg:top-auto lg:right-0 lg:z-20 lg:mt-3 lg:w-72 lg:rounded-[1.75rem]">
                      <div className="space-y-2.5 p-3 lg:space-y-2 lg:p-2.5">
                        {profileMenuItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.label}
                              type="button"
                              onClick={item.onClick}
                              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] transition lg:py-3 lg:text-sm ${
                                item.isDanger
                                  ? "border border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-500/15 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                                  : "border border-slate-200/80 bg-slate-50/80 text-slate-700 hover:border-teal-200 hover:bg-white dark:border-white/8 dark:bg-white/4 dark:text-slate-100 dark:hover:border-teal-400/20 dark:hover:bg-white/6"
                              }`}
                            >
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
                                  item.isDanger
                                    ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"
                                    : "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"
                                }`}
                              >
                                <Icon size={16} strokeWidth={2} />
                              </div>
                              <span className="font-medium">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate(APP_ROUTES.login)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 dark:border-white/12 dark:bg-white/5 dark:text-slate-200 dark:hover:border-teal-400/40 dark:hover:bg-teal-500/10 dark:hover:text-teal-300"
                >
                  {t.headerLogin}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(APP_ROUTES.register)}
                  className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  {t.headerRegister}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {supportsSearch && (
        <div className="mt-2 sm:mt-3 lg:hidden">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors dark:text-slate-500"
              size={16}
              strokeWidth={2}
            />
            <input
              type="search"
              placeholder={t.headerSearchPlaceholder}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 sm:py-3 pr-4 pl-10 text-sm sm:text-[15px] text-slate-800 placeholder:text-slate-400 transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-400/40"
            />
          </div>
        </div>
      )}
    </nav>
  );
}

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const { guardedNavigate } = useAuthGate();

  const navLabelMap: Record<string, string> = {
    "/": t.headerHome,
    "/orders": t.headerOrders,
    "/inventory": t.headerInventory,
    "/messages": t.headerMessages,
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] lg:hidden">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200/80 bg-white/95 p-1 sm:p-1.5 shadow-[0_-8px_32px_-18px_rgba(15,23,42,0.4)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1220]/92 dark:shadow-[0_-12px_36px_-22px_rgba(2,8,23,0.95)]">
        <div className="grid grid-cols-4 gap-1">
          {MAIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.isActive(pathname);

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => guardedNavigate(item.path)}
                className={`flex min-h-14 sm:min-h-16 flex-col items-center justify-center gap-0.5 sm:gap-1 rounded-[1rem] px-1 sm:px-1.5 py-1.5 sm:py-2 text-center transition-all duration-200 ${
                  isActive
                    ? "bg-teal-600 text-white shadow-lg shadow-teal-900/20 dark:bg-white dark:text-slate-900"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/6 dark:hover:text-slate-100"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={18} strokeWidth={isActive ? 2.25 : 2} />
                <span className="text-[11px] font-semibold leading-none tracking-tight">
                  {navLabelMap[item.path] ?? item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const navLabelMap: Record<string, string> = {
    "/": t.headerHome,
    "/orders": t.headerOrders,
    "/inventory": t.headerInventory,
    "/messages": t.headerMessages,
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const profileMenuItems: ProfileMenuItem[] = [
    {
      label: t.headerProfile,
      icon: User,
      onClick: () => {
        navigate(APP_ROUTES.profile);
        setIsProfileOpen(false);
      },
    },
    {
      label: t.headerSettings,
      icon: Settings,
      onClick: () => {
        navigate("/settings");
        setIsProfileOpen(false);
      },
    },
    {
      label: t.headerMyOrders,
      icon: ShoppingCart,
      onClick: () => {
        navigate("/orders");
        setIsProfileOpen(false);
      },
    },
    {
      label: t.headerLogout,
      icon: LogOut,
      onClick: () => {
        setIsProfileOpen(false);
        logout();
      },
      isDanger: true,
    },
  ];

  const displayName = user?.displayName ?? user?.email ?? "U-Rent User";
  const { initials, colorClass } = getAvatarStyle(displayName);

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 flex w-18 flex-col items-center border-r border-slate-200 bg-white py-5 shadow-[4px_0_24px_-10px_rgba(15,118,110,0.20)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[4px_0_24px_-10px_rgba(15,118,110,0.10)]">
      <button
        type="button"
        onClick={() => navigate(APP_ROUTES.home)}
        className="mb-6 flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-white shadow-lg shadow-teal-900/20 ring-1 ring-teal-600/20 transition hover:scale-[0.95]"
        aria-label={t.headerHomeAria}
      >
        <img src="/urent.png" alt="U-Rent" className="h-11 w-11" />
      </button>

      <nav className="flex w-full flex-1 flex-col gap-2 px-2">
        {MAIN_NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.path}
            icon={item.icon}
            label={navLabelMap[item.path] ?? item.label}
            active={item.isActive(pathname)}
            onClick={() => navigate(item.path)}
          />
        ))}
      </nav>

      <div className="relative mt-6" ref={profileRef}>
        <button
          type="button"
          className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-sm font-bold text-white ring-1 ring-white/30 transition hover:scale-110 ${colorClass}`}
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          aria-label={t.headerProfileMenuAria}
        >
          {initials}
        </button>

        {isProfileOpen && (
          <div className="absolute bottom-12 left-0 z-50 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-800 dark:ring-white/4">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700"></div>
            {profileMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm transition last:border-b-0 dark:border-slate-700 ${
                    item.isDanger
                      ? "text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                      : "text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon
                    size={16}
                    strokeWidth={2}
                    className={
                      item.isDanger
                        ? "text-red-600 dark:text-red-400"
                        : "text-teal-600 dark:text-teal-400"
                    }
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
