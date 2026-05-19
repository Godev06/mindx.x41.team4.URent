import type { LucideIcon } from "lucide-react";
import { LayoutGrid, MessageSquare, Package, ShoppingCart } from "lucide-react";
import { APP_ROUTES } from "../../auth/constants";
import type { Lang } from "../../shared/context/LanguageContext";

export const NAV_PATHS = {
  home: APP_ROUTES.home,
  orders: "/orders",
  inventory: "/inventory",
  messages: "/messages",
  settings: "/settings",
  notifications: "/notifications",
} as const;

const NAV_LABELS: Record<Lang, Record<keyof typeof NAV_PATHS, string>> = {
  vi: {
    home: "Trang chủ",
    orders: "Đơn hàng",
    inventory: "Kho",
    messages: "Tin nhắn",
    settings: "Cài đặt",
    notifications: "Thông báo",
  },
  en: {
    home: "Home",
    orders: "Orders",
    inventory: "Inventory",
    messages: "Messages",
    settings: "Settings",
    notifications: "Notifications",
  },
};

const NAV_PATH_TO_KEY: Record<string, keyof typeof NAV_PATHS> = {
  [NAV_PATHS.home]: "home",
  [NAV_PATHS.orders]: "orders",
  [NAV_PATHS.inventory]: "inventory",
  [NAV_PATHS.messages]: "messages",
  [NAV_PATHS.settings]: "settings",
  [NAV_PATHS.notifications]: "notifications",
};

export interface MainNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
}

export function getNavLabel(path: string, lang: Lang): string {
  const key = NAV_PATH_TO_KEY[path];
  return key ? NAV_LABELS[lang][key] : path;
}

export function supportsHeaderSearch(pathname: string): boolean {
  return [NAV_PATHS.home, NAV_PATHS.orders, NAV_PATHS.inventory].some((path) =>
    path === NAV_PATHS.home
      ? pathname === NAV_PATHS.home
      : pathname.startsWith(path),
  );
}

export const MAIN_NAV_ITEMS: MainNavItem[] = [
  {
    path: NAV_PATHS.home,
    label: "Trang chủ",
    icon: LayoutGrid,
    isActive: (pathname) =>
      pathname === NAV_PATHS.home || pathname.startsWith("/product/"),
  },
  {
    path: NAV_PATHS.orders,
    label: "Đơn hàng",
    icon: ShoppingCart,
    isActive: (pathname) => pathname.startsWith(NAV_PATHS.orders),
  },
  {
    path: NAV_PATHS.inventory,
    label: "Kho",
    icon: Package,
    isActive: (pathname) => pathname.startsWith(NAV_PATHS.inventory),
  },
  {
    path: NAV_PATHS.messages,
    label: "Tin nhắn",
    icon: MessageSquare,
    isActive: (pathname) => pathname.startsWith(NAV_PATHS.messages),
  },
];
