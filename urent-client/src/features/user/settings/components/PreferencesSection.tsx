import { Sliders, MoonStar, BellRing, Activity, Languages } from "lucide-react";
import { SettingSwitch } from "./SettingSwitch";
import { PageLoader } from "../../shared/components/PageLoader";
import { SETTINGS_TOKENS } from "../utils/styleTokens";

interface PreferencesSectionProps {
  theme: "dark" | "light";
  isThemeTransitioning: boolean;
  toggleTheme: () => void;
  emailNotifications: boolean;
  screenNotifications: boolean;
  setEmailNotifications: (checked: boolean) => void;
  setScreenNotifications: (checked: boolean) => void;
  lang: "vi" | "en";
  isLanguageTransitioning: boolean;
  setLang: (lang: "vi" | "en") => void;
  t: Record<string, string>;
}

export function PreferencesSection({
  theme,
  isThemeTransitioning,
  toggleTheme,
  emailNotifications,
  screenNotifications,
  setEmailNotifications,
  setScreenNotifications,
  lang,
  isLanguageTransitioning,
  setLang,
  t,
}: PreferencesSectionProps) {
  return (
    <div className={SETTINGS_TOKENS.card}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${SETTINGS_TOKENS.text.muted}`}>
            {t.settingsTabPreferences ?? "Preferences"}
          </p>
          <h3 className={`mt-2 text-lg font-semibold ${SETTINGS_TOKENS.text.strong}`}>
            {t.settingsPreferencesTitle ?? "Tùy chọn hệ thống"}
          </h3>
          <p className={`mt-2 text-sm leading-6 ${SETTINGS_TOKENS.text.muted}`}>
            {t.settingsPreferencesDesc ?? "Manage layout themes and system communication alerts."}
          </p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
          <Sliders size={22} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          {/* Theme Switcher */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700/80 dark:bg-slate-900/50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                  <MoonStar size={18} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${SETTINGS_TOKENS.text.strong}`}>
                    {t.settingsAppearanceMode ?? "Giao diện tối"}
                  </p>
                  <p className={`mt-1 text-xs ${SETTINGS_TOKENS.text.muted}`}>
                    {t.settingsCurrentTheme ?? "Active theme:"}{" "}
                    {theme === "dark" ? (t.settingsDark ?? "Tối") : (t.settingsLight ?? "Sáng")}
                  </p>
                </div>
              </div>
              <SettingSwitch
                checked={theme === "dark"}
                onChange={toggleTheme}
                disabled={isThemeTransitioning}
              />
            </div>
            {isThemeTransitioning ? (
              <div className="mt-3">
                <PageLoader
                  inline
                  tone="slate"
                  label={t.settingsThemeApplying ?? "Applying Theme"}
                />
              </div>
            ) : null}
          </div>

          {/* Email Notifications */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700/80 dark:bg-slate-900/50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  <BellRing size={18} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${SETTINGS_TOKENS.text.strong}`}>
                    {t.settingsEmailNotifications ?? "Thông báo qua Email"}
                  </p>
                  <p className={`mt-1 text-xs ${SETTINGS_TOKENS.text.muted}`}>
                    Receive updates for orders, verification, and important alerts.
                  </p>
                </div>
              </div>
              <SettingSwitch
                checked={emailNotifications}
                onChange={setEmailNotifications}
              />
            </div>
          </div>

          {/* Screen Notifications */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700/80 dark:bg-slate-900/50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                  <Activity size={18} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${SETTINGS_TOKENS.text.strong}`}>
                    {t.settingsScreenNotifications ?? "Thông báo trên màn hình"}
                  </p>
                  <p className={`mt-1 text-xs ${SETTINGS_TOKENS.text.muted}`}>
                    Show updates directly inside the dashboard while working.
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

        {/* Language Selector block */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700/80 dark:bg-slate-900/50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${SETTINGS_TOKENS.text.muted}`}>
                {t.settingsLanguage ?? "Ngôn ngữ"}
              </p>
              <h4 className={`mt-2 text-base font-semibold ${SETTINGS_TOKENS.text.strong}`}>
                {t.settingsLanguage ?? "Ngôn ngữ"}
              </h4>
              <p className={`mt-2 text-sm leading-6 ${SETTINGS_TOKENS.text.muted}`}>
                Apply one language across authentication screens and the dashboard interface.
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <Languages size={18} />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="settings-language-select" className={`text-sm font-medium ${SETTINGS_TOKENS.text.strong}`}>
              {t.settingsLanguage ?? "Select Language"}
            </label>
            <select
              id="settings-language-select"
              value={lang}
              disabled={isLanguageTransitioning}
              onChange={(event) => setLang(event.target.value as "vi" | "en")}
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-teal-400 dark:focus:ring-teal-400/10"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 dark:border-slate-700/80 dark:bg-slate-800">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${SETTINGS_TOKENS.text.muted}`}>
              Active
            </p>
            <p className={`mt-2 text-sm font-semibold uppercase ${SETTINGS_TOKENS.text.strong}`}>
              {lang}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
