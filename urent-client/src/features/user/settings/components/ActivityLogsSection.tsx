import { Activity } from "lucide-react";
import { type ActivityLog } from "../../dataset/activityLogs";
import { SETTINGS_TOKENS } from "../utils/styleTokens";

interface ActivityLogsSectionProps {
  activityLogs: ActivityLog[];
  t: Record<string, string>;
}

export function ActivityLogsSection({
  activityLogs,
  t,
}: ActivityLogsSectionProps) {
  return (
    <div className={SETTINGS_TOKENS.card}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${SETTINGS_TOKENS.text.muted}`}>
            {t.settingsTabActivity ?? "Activity"}
          </p>
          <h3 className={`mt-2 text-lg font-semibold ${SETTINGS_TOKENS.text.strong}`}>
            {t.settingsActivityTitle ?? "Lịch sử hoạt động"}
          </h3>
          <p className={`mt-2 text-sm leading-6 ${SETTINGS_TOKENS.text.muted}`}>
            {t.settingsActivityDesc ?? "Monitor logs of security changes and active logins."}
          </p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
          <Activity size={22} />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {activityLogs.map((log: ActivityLog, index: number) => (
          <div
            key={log.id}
            className="rounded-2xl border border-slate-200/80 bg-slate-50/75 px-4 py-4 dark:border-slate-700/80 dark:bg-slate-900/45 transition-colors duration-150 hover:bg-slate-100/50 dark:hover:bg-slate-800/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 dark:text-teal-300">
                  <Activity size={16} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${SETTINGS_TOKENS.text.strong}`}>
                    {log.action}
                  </p>
                  <p className={`mt-1 text-sm ${SETTINGS_TOKENS.text.muted}`}>
                    {log.description}
                  </p>
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    {log.timestamp}
                  </p>
                </div>
              </div>

              {log.type === "login" ? (
                <span className="rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
                  {log.timestamp.includes("2024-04-09 14:30:00")
                    ? t.settingsCurrent ?? "Current"
                    : `#${index + 1}`}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
