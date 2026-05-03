import { createContext } from "react";

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

export interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
