/**
 * Centralized Tailwind CSS design tokens and layout utility compositions
 * to ensure absolute styling consistency across the settings dashboard.
 */
export const SETTINGS_TOKENS = {
  shell: "rounded-[28px] border shadow-sm ring-1 backdrop-blur-sm transition-colors border-slate-200/80 bg-white/90 ring-slate-900/8 dark:border-slate-700/80 dark:bg-slate-800/85 dark:ring-white/10",
  card: "rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm ring-1 ring-slate-900/6 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/45 dark:ring-white/8",
  text: {
    strong: "text-slate-900 dark:text-slate-100",
    muted: "text-slate-500 dark:text-slate-400",
    title: "text-teal-700 dark:text-teal-400",
  },
  interactive: {
    tabActive: "border border-teal-200/70 bg-teal-50/90 text-teal-800 shadow-sm shadow-teal-100/70 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-200 dark:shadow-none",
    tabInactive: "border border-transparent bg-transparent text-slate-600 hover:border-slate-200/80 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800/70 dark:hover:text-slate-100",
    buttonPrimary: "rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-teal-600/20 transition-all hover:bg-teal-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50",
    buttonSecondary: "rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-teal-500 dark:hover:text-teal-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500",
    ring: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
  }
} as const;
