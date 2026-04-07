import type { ReactNode } from "react";
import type { BadgeVariant } from "../types";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

const BADGE_STYLES: Record<BadgeVariant, string> = {
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  yellow: "bg-yellow-100 text-yellow-700",
  gray: "bg-gray-100 text-gray-700",
};

export function Badge({ children, variant = "blue" }: BadgeProps) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${BADGE_STYLES[variant]}`}>
      {children}
    </span>
  );
}
