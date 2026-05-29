import type { LucideIcon } from "lucide-react";

export type ProductStatus = "Available" | "Active" | "Completed";
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type NotificationType = "order" | "message" | "promotion" | "system";

export interface ProductOwner {
  id?: string;
  name: string;
  avatar: string;
  rating: number;
  trips?: number;
}

export interface Product {
  id?: string | number;
  _id?: string;
  ownerId?: string;
  name: string;
  category: string;
  price: number;
  status: ProductStatus;
  isArchived?: boolean;
  imageUrl?: string;
  condition?: string;
  location?: any;
  locationText?: string;
  coordinates?: number[];
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
  ownerId?: string;
  renterId?: string;
  // New optional detailed partner info
  owner?: {
    id?: string;
    name: string;
    avatar?: string;
  };
  renter?: {
    id?: string;
    name: string;
    avatar?: string;
  };
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
  locationText?: string;
  location?: string;
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