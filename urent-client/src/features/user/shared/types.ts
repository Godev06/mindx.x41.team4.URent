import type { LucideIcon } from "lucide-react";

export type ProductStatus = "Available" | "Active" | "Completed";
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type NotificationType = "order" | "message" | "promotion" | "system";

export interface ProductOwner {
  name: string;
  avatar: string;
  rating: number;
  trips: number;
}

export interface Product {
  id?: string | number;
  _id?: string;
  name: string;
  category: string;
  price: number;
  status: ProductStatus;
  isArchived?: boolean;
  imageUrl?: string;
  image?: string;
  condition?: string;
  // Bổ sung các thuộc tính cần thiết để tránh lỗi TypeScript
  locationText?: string; 
  location?: any;
  coordinates?: number[];
  // ----------------------------------------
  rating?: number;
  reviewsCount?: number;
  reviews?: number;
  owner?: ProductOwner;
  summary?: string;
  description?: string[];
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
  productId: string | number;
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
  id: string | number;
  name: string;
  category: string;
  price: number;
  statusQuantities: {
    available: number;
    rented: number;
    overdue: number;
  };
  condition?: string;
  lastUpdated: string;
  description?: string[];
  imageUrl?: string;
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