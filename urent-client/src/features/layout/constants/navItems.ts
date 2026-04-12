import type { LucideIcon } from "lucide-react";
import { LayoutGrid, MessageSquare, Package, ShoppingCart } from "lucide-react";

export interface MainNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
}

export const MAIN_NAV_ITEMS: MainNavItem[] = [
  {
    path: "/",
    label: "Trang chủ",
    icon: LayoutGrid,
    isActive: (pathname) => pathname === "/" || pathname.startsWith("/product/"),
  },
  {
    path: "/orders",
    label: "Đơn hàng",
    icon: ShoppingCart,
    isActive: (pathname) => pathname.startsWith("/orders"),
  },
  {
    path: "/inventory",
    label: "Kho",
    icon: Package,
    isActive: (pathname) => pathname.startsWith("/inventory"),
  },
  {
    path: "/messages",
    label: "Tin nhắn",
    icon: MessageSquare,
    isActive: (pathname) => pathname.startsWith("/messages"),
  },
];
