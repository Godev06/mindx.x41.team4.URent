import { CheckCircle2, XCircle, Info } from "lucide-react";
import type { ReactNode } from "react";

interface AlertMessageProps {
  title?: string;
  message: string;
  variant?: "error" | "success" | "info";
  actions?: ReactNode;
}

const styles = {
  error: {
    container: "border-red-200/60 bg-red-50/40 text-red-900 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-200",
    iconRing: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/20",
    icon: XCircle,
  },
  success: {
    container: "border-emerald-200/60 bg-emerald-50/40 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/5 dark:text-emerald-200",
    iconRing: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/20",
    icon: CheckCircle2,
  },
  info: {
    container: "border-teal-200/60 bg-teal-50/40 text-teal-900 dark:border-teal-500/20 dark:bg-teal-500/5 dark:text-teal-200",
    iconRing: "bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400 dark:ring-teal-500/20",
    icon: Info,
  },
};

export function AlertMessage({
  title,
  message,
  variant = "error",
  actions,
}: AlertMessageProps) {
  const currentStyle = styles[variant];
  const Icon = currentStyle.icon;

  return (
    <div
      role="alert"
      className={`relative overflow-hidden rounded-2xl border p-4 shadow-xs backdrop-blur-xs transition-all duration-300 ring-1 ring-slate-900/5 dark:ring-white/5 ${currentStyle.container}`}
    >
      <div className="flex items-start gap-3.5">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${currentStyle.iconRing}`}>
          <Icon size={16} strokeWidth={2.5} />
        </div>
        
        <div className="min-w-0 flex-1">
          {title ? (
            <p className="text-sm font-bold tracking-tight mb-0.5">{title}</p>
          ) : null}
          <p className={`text-xs leading-relaxed opacity-90`}>{message}</p>
          
          {actions ? (
            <div className="mt-3 flex items-center gap-2.5">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
