import { Lock } from "lucide-react";
import { SETTINGS_TOKENS } from "../utils/styleTokens";

interface PasswordSectionProps {
  isPasswordSet: boolean;
  onTriggerChange: () => void;
  t: Record<string, string>;
}

export function PasswordSection({
  isPasswordSet,
  onTriggerChange,
  t,
}: PasswordSectionProps) {
  const statusLabel = isPasswordSet
    ? t.settingsPasswordSet ?? "Mật khẩu đã được đặt"
    : t.settingsPasswordNotSet ?? "Mật khẩu chưa được đặt";

  const statusDesc = isPasswordSet
    ? t.settingsChangePasswordDesc ?? "Change your password regularly for maximum security."
    : t.setupPasswordNoticeBody ?? "You have not configured a security credentials password. Set one up now.";

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-linear-to-br from-white via-white to-slate-50 p-5 shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:ring-white/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-sm font-semibold ${SETTINGS_TOKENS.text.strong}`}>
            {t.settingsChangePassword ?? "Thay đổi mật khẩu"}
          </p>
          <p className={`mt-1 text-sm leading-6 ${SETTINGS_TOKENS.text.muted}`}>
            {t.settingsChangePasswordDesc ?? "Change your password regularly for maximum security."}
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <Lock size={18} />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-700/80 dark:bg-slate-900/60">
        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${SETTINGS_TOKENS.text.muted}`}>
          {t.settingsSecurityStatusLabel ?? "STATUS"}
        </p>
        <p
          className={`mt-2 text-sm font-semibold ${
            isPasswordSet ? "text-teal-600 dark:text-teal-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {statusLabel}
        </p>
        <p className={`mt-2 text-sm leading-6 ${SETTINGS_TOKENS.text.muted}`}>
          {statusDesc}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-end">
        <button
          type="button"
          onClick={onTriggerChange}
          className={
            isPasswordSet
              ? SETTINGS_TOKENS.interactive.buttonSecondary
              : SETTINGS_TOKENS.interactive.buttonPrimary
          }
        >
          {isPasswordSet
            ? t.settingsChange ?? "Change"
            : t.settingsSetPassword ?? "Set password"}
        </button>
      </div>
    </div>
  );
}
