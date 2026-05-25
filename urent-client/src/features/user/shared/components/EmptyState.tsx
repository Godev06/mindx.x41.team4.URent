import { type ComponentType } from "react";
import { Info } from "lucide-react";
import { useTheme } from "../../settings/hooks/useTheme";

interface EmptyStateProps {
  message?: string;
  icon?: ComponentType<{ className?: string; size?: number }>;
  className?: string;
}

export function EmptyState({
  message = "No data available.",
  icon: Icon = Info,
  className = "",
}: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center py-8 px-4 text-center transition-all duration-200 ease-out ${
        theme === "dark" ? "text-slate-400" : "text-slate-500"
      } ${className}`}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-xs ring-1 ring-slate-900/5 dark:ring-white/5 transition-transform duration-200 hover:scale-105">
        <Icon size={22} />
      </div>
      <p className="text-sm font-medium tracking-tight max-w-xs leading-relaxed">
        {message}
      </p>
    </div>
  );
}
