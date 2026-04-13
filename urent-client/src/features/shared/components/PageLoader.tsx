import type { ReactNode } from "react";

interface PageLoaderProps {
  label?: ReactNode;
  fullScreen?: boolean;
  inline?: boolean;
  tone?: "teal" | "emerald" | "amber" | "slate";
  showSpinner?: boolean;
}

export function PageLoader({
  label = "",
  fullScreen = false,
  inline = false,
  tone = "teal",
  showSpinner = true,
}: PageLoaderProps) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-700 dark:text-emerald-200"
      : tone === "amber"
        ? "text-amber-700 dark:text-amber-200"
        : tone === "slate"
          ? "text-slate-700 dark:text-slate-200"
          : "text-teal-700 dark:text-teal-200";

  const spinnerToneClass =
    tone === "emerald"
      ? "border-emerald-500/25 border-t-emerald-500"
      : tone === "amber"
        ? "border-amber-500/25 border-t-amber-500"
        : tone === "slate"
          ? "border-slate-500/25 border-t-slate-500 dark:border-slate-300/25 dark:border-t-slate-300"
          : "border-teal-500/25 border-t-teal-500";

  const dotToneClass =
    tone === "emerald"
      ? "bg-emerald-500"
      : tone === "amber"
        ? "bg-amber-500"
        : tone === "slate"
          ? "bg-slate-500 dark:bg-slate-300"
          : "bg-teal-500";

  return (
    <div
      className={`flex items-center justify-center ${
        inline
          ? ""
          : fullScreen
            ? "min-h-screen bg-linear-to-br from-slate-50 via-white to-teal-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/30"
            : "min-h-60"
      }`}
    >
      <div
        className={`relative overflow-hidden border border-slate-200/80 bg-white/90 text-slate-600 ring-1 ring-slate-900/5 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-300 dark:ring-white/10 ${
          inline
            ? "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight shadow-sm shadow-slate-900/5 dark:shadow-black/20"
            : "rounded-2xl px-6 py-5 shadow-xl shadow-slate-900/5 dark:shadow-black/20"
        }`}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-teal-400/50 to-transparent" />

        <div className={`flex items-center ${inline ? "gap-1.5" : "gap-3"}`}>
          {showSpinner ? (
            <span
              className={`relative flex items-center justify-center ${
                inline ? "h-4 w-4" : "h-6 w-6"
              }`}
            >
              <span
                className={`absolute animate-spin rounded-full border-2 ${spinnerToneClass} ${
                  inline ? "h-4 w-4" : "h-6 w-6"
                }`}
              />
              <span
                className={`${dotToneClass} rounded-full ${
                  inline ? "h-1.5 w-1.5" : "h-2 w-2"
                }`}
              />
            </span>
          ) : (
            <span className={`h-1.5 w-1.5 rounded-full ${dotToneClass}`} />
          )}

          <div className={inline ? "" : "space-y-1"}>
            <p
              className={`${toneClass} ${
                inline
                  ? "text-[11px] font-semibold tracking-tight"
                  : "text-sm font-semibold"
              }`}
            >
              {label || "Loading"}
            </p>
            {!inline ? (
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <span
                  className={`block h-full w-2/3 animate-pulse rounded-full ${dotToneClass}`}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
