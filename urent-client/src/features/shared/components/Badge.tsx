import type { ReactNode } from "react";
import type { BadgeVariant } from "../types";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

const BADGE_STYLES: Record<BadgeVariant, string> = {
  blue: "bg-teal-50 text-teal-600 ring-1 ring-inset ring-teal-600/15",
  green: "bg-teal-100/50 text-teal-700 ring-1 ring-inset ring-teal-600/15",
  yellow: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/15",
  gray: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-400/15",
};

export function Badge({ children, variant = "blue" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight ${BADGE_STYLES[variant]}`}>
      {children}
    </span>
  );
}
