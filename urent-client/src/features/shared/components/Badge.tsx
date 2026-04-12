import type { ReactNode } from "react";
import type { BadgeVariant } from "../types";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

const BADGE_STYLES: Record<BadgeVariant, string> = {
  blue: "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 ring-1 ring-inset ring-teal-600/15 dark:ring-teal-600/50",
  green:
    "bg-teal-100/50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 ring-1 ring-inset ring-teal-600/15 dark:ring-teal-600/50",
  yellow:
    "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-600/15 dark:ring-amber-600/50",
  gray: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-400/15 dark:ring-slate-600/50",
};

export function Badge({ children, variant = "blue" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight ${BADGE_STYLES[variant]}`}
    >
      {children}
    </span>
  );
}
