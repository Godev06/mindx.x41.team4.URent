import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import {
  ToastContext,
  type ToastContextValue,
  type ToastItem,
  type ToastVariant,
} from "../context/toastContext";

const variantStyles = {
  success: {
    container: "border-emerald-200/60 bg-white/95 text-slate-800 dark:border-emerald-500/25 dark:bg-[#0b1220]/95 dark:text-slate-100",
    iconRing: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
    icon: CheckCircle2,
  },
  error: {
    container: "border-red-200/60 bg-white/95 text-slate-800 dark:border-red-500/25 dark:bg-[#0b1220]/95 dark:text-slate-100",
    iconRing: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20",
    icon: XCircle,
  },
  info: {
    container: "border-teal-200/60 bg-white/95 text-slate-800 dark:border-teal-500/25 dark:bg-[#0b1220]/95 dark:text-slate-100",
    iconRing: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400 dark:ring-teal-500/20",
    icon: Info,
  },
};

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    if (!toasts.length) {
      return undefined;
    }

    const timers = toasts.map((toast) => {
      return window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, 4000);
    });

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [toasts]);

  const value = useMemo<ToastContextValue>(() => {
    return {
      showToast: ({ title, description, variant }) => {
        setToasts((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            title,
            description,
            variant,
          },
        ]);
      },
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const style = variantStyles[toast.variant];
          const Icon = style.icon;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 ring-1 ring-slate-900/5 dark:ring-white/5 animate-in fade-in slide-in-from-top-4 slide-in-from-right-4 ${style.container}`}
              role="alert"
            >
              {/* Colored status indicator strip on the left */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-500 to-cyan-500" />
              
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${style.iconRing}`}>
                <Icon size={16} strokeWidth={2.5} />
              </div>

              <div className="min-w-0 flex-1 pr-6">
                <p className="text-sm font-bold tracking-tight">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {toast.description}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss toast"
                className="absolute right-3.5 top-3.5 flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
