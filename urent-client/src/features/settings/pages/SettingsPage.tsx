import { useEffect, useState } from "react";
import {
  Activity,
  BellRing,
  Languages,
  Lock,
  MoonStar,
  ShieldCheck,
  Sliders,
} from "lucide-react";
import { ACTIVITY_LOGS } from "../../shared/data";
import { useTheme } from "../hooks/useTheme";
import { useI18n } from "../../shared/context/LanguageContext";
import { PageLoader } from "../../shared/components/PageLoader";
import { useToast } from "../../shared/hooks/useToast";
import { normalizeApiError } from "../../../lib/api/apiError";
import { settingsService } from "../services/settingsService";

function SettingSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all ${
        checked ? "bg-teal-600" : "bg-slate-300 dark:bg-slate-700"
      } ${disabled ? "cursor-wait opacity-70" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function SettingsPage() {
  const {
    theme,
    isThemeTransitioning,
    toggleTheme,
    emailNotifications,
    screenNotifications,
    setEmailNotifications,
    setScreenNotifications,
  } = useTheme();
  const { t, setLang, lang, isLanguageTransitioning } = useI18n();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "security" | "activity" | "preferences"
  >("security");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isLoadingTwoFactor, setIsLoadingTwoFactor] = useState(true);
  const [isSavingTwoFactor, setIsSavingTwoFactor] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const settings = await settingsService.getSettings();
        if (isMounted) {
          setTwoFactorEnabled(settings.twoFactorEnabled);
        }
      } catch (error: unknown) {
        if (isMounted) {
          showToast({
            title: t.settingsTwoFactor,
            description:
              normalizeApiError(error).message || t.settingsTwoFactorLoadError,
            variant: "error",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingTwoFactor(false);
        }
      }
    };

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, [showToast, t.settingsTwoFactor, t.settingsTwoFactorLoadError]);

  const handleTwoFactorChange = async (enabled: boolean) => {
    setIsSavingTwoFactor(true);

    try {
      const settings = await settingsService.updateTwoFactorEnabled(enabled);
      setTwoFactorEnabled(settings.twoFactorEnabled);
      showToast({
        title: t.settingsTwoFactorUpdated,
        description: settings.twoFactorEnabled
          ? t.settingsTwoFactorEnabled
          : t.settingsTwoFactorDisabled,
        variant: "success",
      });
    } catch (error: unknown) {
      showToast({
        title: t.settingsTwoFactor,
        description: normalizeApiError(error).message,
        variant: "error",
      });
    } finally {
      setIsSavingTwoFactor(false);
    }
  };

  const tabs = [
    {
      id: "security" as const,
      label: t.settingsTabSecurity,
      icon: Lock,
    },
    {
      id: "activity" as const,
      label: t.settingsTabActivity,
      icon: Activity,
    },
    {
      id: "preferences" as const,
      label: t.settingsTabPreferences,
      icon: Sliders,
    },
  ];

  const shellClass =
    "rounded-[28px] border shadow-sm ring-1 backdrop-blur-sm transition-colors";
  const shellTone =
    "border-slate-200/80 bg-white/90 ring-slate-900/8 dark:border-slate-700/80 dark:bg-slate-800/85 dark:ring-white/10";
  const cardClass =
    "rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm ring-1 ring-slate-900/6 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/45 dark:ring-white/8";
  const strongText = "text-slate-900 dark:text-slate-100";
  const mutedText = "text-slate-500 dark:text-slate-400";

  return (
    <div className="space-y-5">
      <section
        className={`${shellClass} ${shellTone} relative overflow-hidden px-4 py-5 sm:px-6 sm:py-6`}
      >
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-teal-500/12 blur-3xl" />
        <div className="absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
              <ShieldCheck size={14} />
              Settings Hub
            </div>
            <h1
              className={`mt-4 text-2xl font-semibold tracking-tight sm:text-3xl ${strongText}`}
            >
              {t.settingsPageTitle}
            </h1>
            <p className={`mt-2 max-w-xl text-sm leading-6 ${mutedText}`}>
              {t.settingsPageDesc}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-md">
            <div className="rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-3 ring-1 ring-slate-900/5 dark:border-slate-700/70 dark:bg-slate-900/55 dark:ring-white/8">
              <p
                className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${mutedText}`}
              >
                {t.settingsAppearanceMode}
              </p>
              <p className={`mt-2 text-sm font-semibold ${strongText}`}>
                {theme === "dark" ? t.settingsDark : t.settingsLight}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-3 ring-1 ring-slate-900/5 dark:border-slate-700/70 dark:bg-slate-900/55 dark:ring-white/8">
              <p
                className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${mutedText}`}
              >
                {t.settingsLanguage}
              </p>
              <p
                className={`mt-2 text-sm font-semibold uppercase ${strongText}`}
              >
                {lang}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-3 ring-1 ring-slate-900/5 dark:border-slate-700/70 dark:bg-slate-900/55 dark:ring-white/8">
              <p
                className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${mutedText}`}
              >
                {t.settingsEmailNotifications}
              </p>
              <p className={`mt-2 text-sm font-semibold ${strongText}`}>
                {emailNotifications ? "ON" : "OFF"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${shellClass} ${shellTone} overflow-hidden`}>
        <div className="border-b border-slate-200/70 px-3 py-3 dark:border-slate-700/70 sm:px-6 sm:py-4">
          <nav className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex shrink-0 items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "border border-teal-200/70 bg-teal-50/90 text-teal-800 shadow-sm shadow-teal-100/70 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-200 dark:shadow-none"
                      : "border border-transparent bg-transparent text-slate-600 hover:border-slate-200/80 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-2xl ring-1 ${
                      isActive
                        ? "bg-white/80 text-teal-700 ring-teal-200/70 dark:bg-teal-500/10 dark:text-teal-200 dark:ring-teal-500/20"
                        : "bg-slate-100 ring-slate-200 dark:bg-slate-700/70 dark:ring-slate-600"
                    }`}
                  >
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 sm:p-6">
          {activeTab === "security" && (
            <div className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
              <div className={cardClass}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                      {t.settingsSecurityBadge}
                    </span>
                    <h3 className={`mt-3 text-xl font-semibold ${strongText}`}>
                      {t.settingsSecurityTitle}
                    </h3>
                    <p
                      className={`mt-2 max-w-2xl text-sm leading-6 ${mutedText}`}
                    >
                      {t.settingsSecurityPanelDesc}
                    </p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-100 text-amber-700 shadow-sm ring-1 ring-amber-200/70 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20">
                    <Lock size={24} />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200/80 bg-linear-to-br from-white via-white to-slate-50 p-5 shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:ring-white/10">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-sm font-semibold ${strongText}`}>
                          {t.settingsChangePassword}
                        </p>
                        <p className={`mt-1 text-sm leading-6 ${mutedText}`}>
                          {t.settingsChangePasswordDesc}
                        </p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <Lock size={18} />
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-700/80 dark:bg-slate-900/60">
                      <p
                        className={`text-xs font-semibold uppercase tracking-[0.18em] ${mutedText}`}
                      >
                        {t.settingsSecurityStatusLabel}
                      </p>
                      <p className={`mt-2 text-sm font-semibold ${strongText}`}>
                        {t.settingsSecurityPasswordHint}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-end">
                      <button
                        type="button"
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-teal-500 dark:hover:text-teal-300"
                      >
                        {t.settingsChange}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200/80 bg-linear-to-br from-teal-50 via-white to-white p-5 shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700/80 dark:from-teal-500/10 dark:via-slate-900 dark:to-slate-900 dark:ring-white/10">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-sm font-semibold ${strongText}`}>
                          {t.settingsTwoFactor}
                        </p>
                        <p className={`mt-1 text-sm leading-6 ${mutedText}`}>
                          {t.settingsSecurity2FADesc}
                        </p>
                      </div>
                      <SettingSwitch
                        checked={twoFactorEnabled}
                        onChange={handleTwoFactorChange}
                        disabled={isLoadingTwoFactor || isSavingTwoFactor}
                      />
                    </div>

                    <div className="mt-4 inline-flex items-center rounded-full border border-teal-200/70 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">
                      {twoFactorEnabled
                        ? t.settingsTwoFactorEnabled
                        : t.settingsSecurity2FAHint}
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${cardClass} flex flex-col justify-between`}>
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                    <ShieldCheck size={22} />
                  </div>
                  <p
                    className={`mt-4 text-xs font-semibold uppercase tracking-[0.18em] ${mutedText}`}
                  >
                    {t.settingsSecurityBadge}
                  </p>
                  <h3 className={`mt-2 text-lg font-semibold ${strongText}`}>
                    {t.settingsSecurityPanelTitle}
                  </h3>
                  <p className={`mt-2 text-sm leading-6 ${mutedText}`}>
                    {t.settingsSecurityStrengthDesc}
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 dark:border-slate-700/80 dark:bg-slate-900/50">
                    <p
                      className={`text-xs font-semibold uppercase tracking-[0.18em] ${mutedText}`}
                    >
                      {t.settingsSecurityStrengthLabel}
                    </p>
                    <p className={`mt-2 text-base font-semibold ${strongText}`}>
                      {t.settingsSecurityStrengthValue}
                    </p>
                    <p className={`mt-1 text-sm leading-6 ${mutedText}`}>
                      {t.settingsSecurityStrengthDesc}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 dark:border-slate-700/80 dark:bg-slate-900/50">
                    <p
                      className={`text-xs font-semibold uppercase tracking-[0.18em] ${mutedText}`}
                    >
                      {t.settingsSecurityStatusLabel}
                    </p>
                    <p className={`mt-2 text-base font-semibold ${strongText}`}>
                      {t.settingsSecurityStatusValue}
                    </p>
                    <p className={`mt-1 text-sm leading-6 ${mutedText}`}>
                      {t.settingsSecurityStatusDesc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className={cardClass}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className={`text-xs font-semibold uppercase tracking-[0.18em] ${mutedText}`}
                  >
                    {t.settingsTabActivity}
                  </p>
                  <h3 className={`mt-2 text-lg font-semibold ${strongText}`}>
                    {t.settingsActivityTitle}
                  </h3>
                  <p className={`mt-2 text-sm leading-6 ${mutedText}`}>
                    {t.settingsActivityDesc}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                  <Activity size={22} />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {ACTIVITY_LOGS.map((log, index) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/75 px-4 py-4 dark:border-slate-700/80 dark:bg-slate-900/45"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-teal-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 dark:text-teal-300">
                          <Activity size={16} />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${strongText}`}>
                            {log.action}
                          </p>
                          <p className={`mt-1 text-sm ${mutedText}`}>
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
                            ? t.settingsCurrent
                            : `#${index + 1}`}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className={cardClass}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className={`text-xs font-semibold uppercase tracking-[0.18em] ${mutedText}`}
                  >
                    {t.settingsTabPreferences}
                  </p>
                  <h3 className={`mt-2 text-lg font-semibold ${strongText}`}>
                    {t.settingsPreferencesTitle}
                  </h3>
                  <p className={`mt-2 text-sm leading-6 ${mutedText}`}>
                    {t.settingsPreferencesDesc}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                  <Sliders size={22} />
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700/80 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                          <MoonStar size={18} />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${strongText}`}>
                            {t.settingsAppearanceMode}
                          </p>
                          <p className={`mt-1 text-xs ${mutedText}`}>
                            {t.settingsCurrentTheme}{" "}
                            {theme === "dark"
                              ? t.settingsDark
                              : t.settingsLight}
                          </p>
                        </div>
                      </div>
                      <SettingSwitch
                        checked={theme === "dark"}
                        onChange={() => toggleTheme()}
                        disabled={isThemeTransitioning}
                      />
                    </div>
                    {isThemeTransitioning ? (
                      <div className="mt-3">
                        <PageLoader
                          inline
                          tone="slate"
                          label={t.settingsThemeApplying}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700/80 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                          <BellRing size={18} />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${strongText}`}>
                            {t.settingsEmailNotifications}
                          </p>
                          <p className={`mt-1 text-xs ${mutedText}`}>
                            Receive updates for orders, verification, and
                            important alerts.
                          </p>
                        </div>
                      </div>
                      <SettingSwitch
                        checked={emailNotifications}
                        onChange={setEmailNotifications}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700/80 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                          <Activity size={18} />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${strongText}`}>
                            {t.settingsScreenNotifications}
                          </p>
                          <p className={`mt-1 text-xs ${mutedText}`}>
                            Show updates directly inside the dashboard while
                            working.
                          </p>
                        </div>
                      </div>
                      <SettingSwitch
                        checked={screenNotifications}
                        onChange={setScreenNotifications}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700/80 dark:bg-slate-900/50">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p
                        className={`text-xs font-semibold uppercase tracking-[0.18em] ${mutedText}`}
                      >
                        {t.settingsLanguage}
                      </p>
                      <h4
                        className={`mt-2 text-base font-semibold ${strongText}`}
                      >
                        {t.settingsLanguage}
                      </h4>
                      <p className={`mt-2 text-sm leading-6 ${mutedText}`}>
                        Apply one language across authentication screens and the
                        dashboard interface.
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      <Languages size={18} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className={`text-sm font-medium ${strongText}`}>
                      {t.settingsLanguage}
                    </label>
                    <select
                      value={lang}
                      disabled={isLanguageTransitioning}
                      onChange={(event) =>
                        setLang(event.target.value as "vi" | "en")
                      }
                      className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-teal-400 dark:focus:ring-teal-400/10"
                    >
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 dark:border-slate-700/80 dark:bg-slate-800">
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${mutedText}`}
                    >
                      Active
                    </p>
                    <p
                      className={`mt-2 text-sm font-semibold uppercase ${strongText}`}
                    >
                      {lang}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
