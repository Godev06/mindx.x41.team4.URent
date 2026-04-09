import type { LucideIcon } from "lucide-react";

export type ProductStatus = "Available" | "Active" | "Completed";
export type BadgeVariant = "blue" | "green" | "yellow" | "gray";
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type NotificationType = "order" | "message" | "promotion" | "system";

export interface ProductOwner {
  name: string;
  avatar: string;
  rating: number;
  trips: number;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  status: ProductStatus;
  image: string;
  imageUrl?: string;
  rating?: number;
  reviews?: number;
  owner?: ProductOwner;
  description?: string;
  specs?: string[];
}

export interface Chat {
  id: number;
  name: string;
  message: string;
  time: string;
  active: boolean;
  avatar: string;
}

export interface Message {
  id: number;
  chatId: number;
  content: string;
  timestamp: string;
  sender: "user" | "other";
  senderName: string;
  senderAvatar: string;
}

export interface Order {
  id: string;
  productId: number;
  productName: string;
  customerName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: OrderStatus;
  image: string;
}

export interface Notification {
  id: number;
  title: string;
  description: string;
  type: NotificationType;
  time: string;
  read: boolean;
}

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  price: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  lastUpdated: string;
}

export interface ActivityLog {
  id: number;
  action: string;
  description: string;
  timestamp: string;
  type: "login" | "order" | "message" | "settings";
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinDate: string;
  address: string;
  rating: number;
  completedOrders: number;
}

export interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}
