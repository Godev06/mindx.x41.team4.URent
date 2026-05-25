import { SettingSwitch } from "./SettingSwitch";
import { SETTINGS_TOKENS } from "../utils/styleTokens";

interface TwoFactorAuthSectionProps {
  twoFactorEnabled: boolean;
  onToggleChange: (enabled: boolean) => void;
  isLoading: boolean;
  isSaving: boolean;
  t: Record<string, string>;
}

export function TwoFactorAuthSection({
  twoFactorEnabled,
  onToggleChange,
  isLoading,
  isSaving,
  t,
}: TwoFactorAuthSectionProps) {
  const statusTag = twoFactorEnabled
    ? t.settingsTwoFactorEnabled ?? "Two-Factor Enabled"
    : t.settingsSecurity2FAHint ?? "Two-factor authentication is not active. Enable it for maximum protection.";

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-linear-to-br from-teal-50 via-white to-white p-5 shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700/80 dark:from-teal-500/10 dark:via-slate-900 dark:to-slate-900 dark:ring-white/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-sm font-semibold ${SETTINGS_TOKENS.text.strong}`}>
            {t.settingsTwoFactor ?? "Xác thực 2 yếu tố"}
          </p>
          <p className={`mt-1 text-sm leading-6 ${SETTINGS_TOKENS.text.muted}`}>
            {t.settingsSecurity2FADesc ?? "Protect your account by adding an additional security layer."}
          </p>
        </div>
        <SettingSwitch
          checked={twoFactorEnabled}
          onChange={onToggleChange}
          disabled={isLoading || isSaving}
        />
      </div>

      <div className="mt-4 inline-flex items-center rounded-full border border-teal-200/70 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">
        {statusTag}
      </div>
    </div>
  );
}
