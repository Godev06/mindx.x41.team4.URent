import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { User, Settings, ShoppingCart, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SidebarItem } from "../../shared/components/SidebarItem";
import { MAIN_NAV_ITEMS } from "../constants/navItems";
import { USER_PROFILE } from "../../shared/data";
import { getAvatarStyle } from "../../shared/utils/avatar";

interface ProfileMenuItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  isDanger?: boolean;
}

export function AppSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

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
      label: "Profile",
      icon: User,
      onClick: () => {
        navigate("/profile");
        setIsProfileOpen(false);
      },
    },
    {
      label: "Settings",
      icon: Settings,
      onClick: () => {
        navigate("/settings");
        setIsProfileOpen(false);
      },
    },
    {
      label: "My Order",
      icon: ShoppingCart,
      onClick: () => {
        navigate("/orders");
        setIsProfileOpen(false);
      },
    },
    {
      label: "Logout",
      icon: LogOut,
      onClick: () => {
        // Clear session/auth data
        localStorage.removeItem("authToken");
        sessionStorage.clear();
        setIsProfileOpen(false);
        navigate("/");
      },
      isDanger: true,
    },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-18 z-40 flex flex-col items-center border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-5 shadow-[4px_0_24px_-10px_rgba(15,118,110,0.20)] dark:shadow-[4px_0_24px_-10px_rgba(15,118,110,0.10)]\">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg shadow-teal-900/20 ring-1 ring-teal-600/20 transition hover:scale-[0.95] cursor-pointer"
        aria-label="U-Rent — Trang chủ"
      >
        <img src="/urent.png" alt="U-Rent" className="h-11 w-11" />
      </button>

      <nav className="flex w-full flex-1 flex-col gap-2 px-2">
        {MAIN_NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            active={item.isActive(pathname)}
            onClick={() => navigate(item.path)}
          />
        ))}
      </nav>

      <div className="relative mt-6" ref={profileRef}>
        {(() => {
          const { initials, colorClass } = getAvatarStyle(USER_PROFILE.name);
          return (
            <button
              type="button"
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ring-1 ring-white/30 transition hover:scale-110 cursor-pointer ${colorClass}`}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              aria-label="Profile menu"
            >
              {initials}
            </button>
          );
        })()}

        {isProfileOpen && (
          <div className="absolute bottom-12 left-0 w-48 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg ring-1 ring-slate-900/5 dark:ring-white/4 z-50">
            {profileMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className={`flex w-full items-center gap-3 border-b border-slate-100 dark:border-slate-700 px-4 py-3 text-sm transition last:border-b-0 ${
                    item.isDanger
                      ? "hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      : "hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100"
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
