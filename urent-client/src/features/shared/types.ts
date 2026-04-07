import type { LucideIcon } from "lucide-react";

export type ProductStatus = "Available" | "Active" | "Completed";
export type BadgeVariant = "blue" | "green" | "yellow" | "gray";

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

export interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}
