import { useState, useMemo } from "react";
import { Activity, Lock, ShieldCheck, Sliders } from "lucide-react";
import { ACTIVITY_LOGS } from "../../dataset/activityLogs";
import { useTheme } from "../hooks/useTheme";
import { useI18n } from "../../shared/context/LanguageContext";
import { PageLoader } from "../../shared/components/PageLoader";
import { SETTINGS_TOKENS } from "../utils/styleTokens";
import { useSecuritySettings } from "../hooks/useSecuritySettings";
import { PasswordSection } from "../components/PasswordSection";
import { TwoFactorAuthSection } from "../components/TwoFactorAuthSection";
import { ActivityLogsSection } from "../components/ActivityLogsSection";
import { PreferencesSection } from "../components/PreferencesSection";
import { ChangePasswordModal } from "../components/ChangePasswordModal";

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

  // Clean hook for security states and actions
  const {
    twoFactorEnabled,
    isPasswordSet,
    isLoading: isLoadingSecurity,
    isSaving2FA,
    isPasswordModalOpen,
    handleTwoFactorChange,
    openPasswordModal,
    closePasswordModal,
    handlePasswordSuccess,
  } = useSecuritySettings();

  const [activeTab, setActiveTab] = useState<"security" | "activity" | "preferences" | "test">("security");

  const tabs = useMemo(
    () => [
      {
        id: "security" as const,
        label: t.settingsTabSecurity ?? "Bảo mật",
        icon: Lock,
      },
      {
        id: "activity" as const,
        label: t.settingsTabActivity ?? "Hoạt động",
        icon: Activity,
      },
      {
        id: "preferences" as const,
        label: t.settingsTabPreferences ?? "Tùy chọn",
        icon: Sliders,
      },
      {
        id: "test" as const,
        label: "Test",
        icon: ShieldCheck,
      },
    ],
    [t]
  );

  return (
    <div className="space-y-5">
      {/* Upper Banner Shell Panel */}
      <section className={`${SETTINGS_TOKENS.shell} relative overflow-hidden px-4 py-5 sm:px-6 sm:py-6`}>
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-teal-500/12 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
              <ShieldCheck size={14} />
              Settings Hub
            </div>
            <h1 className={`mt-4 text-2xl font-semibold tracking-tight sm:text-3xl ${SETTINGS_TOKENS.text.strong}`}>
              {t.settingsPageTitle ?? "Thiết lập tài khoản"}
            </h1>
            <p className={`mt-2 max-w-xl text-sm leading-6 ${SETTINGS_TOKENS.text.muted}`}>
              {t.settingsPageDesc ?? "Configure login criteria, view security session histories, and select layout options."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-md">
            <div className="rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-3 ring-1 ring-slate-900/5 dark:border-slate-700/70 dark:bg-slate-900/55 dark:ring-white/8">
              <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${SETTINGS_TOKENS.text.muted}`}>
                {t.settingsAppearanceMode ?? "Giao diện"}
              </p>
              <p className={`mt-2 text-sm font-semibold uppercase ${SETTINGS_TOKENS.text.strong}`}>
                {theme === "dark" ? (t.settingsDark ?? "Tối") : (t.settingsLight ?? "Sáng")}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-3 ring-1 ring-slate-900/5 dark:border-slate-700/70 dark:bg-slate-900/55 dark:ring-white/8">
              <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${SETTINGS_TOKENS.text.muted}`}>
                {t.settingsLanguage ?? "Ngôn ngữ"}
              </p>
              <p className={`mt-2 text-sm font-semibold uppercase ${SETTINGS_TOKENS.text.strong}`}>
                {lang}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-3 ring-1 ring-slate-900/5 dark:border-slate-700/70 dark:bg-slate-900/55 dark:ring-white/8">
              <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${SETTINGS_TOKENS.text.muted}`}>
                {t.settingsEmailNotifications ?? "Thông báo"}
              </p>
              <p className={`mt-2 text-sm font-semibold ${SETTINGS_TOKENS.text.strong}`}>
                {emailNotifications ? "ON" : "OFF"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabbed Container Panel */}
      <section className={`${SETTINGS_TOKENS.shell} overflow-hidden`}>
        <div className="border-b border-slate-200/70 px-3 py-3 dark:border-slate-700/70 sm:px-6 sm:py-4">
          <nav className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap" aria-label="Settings Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-selected={isActive}
                  role="tab"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex shrink-0 items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
                    isActive
                      ? SETTINGS_TOKENS.interactive.tabActive
                      : SETTINGS_TOKENS.interactive.tabInactive
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

        {/* Tab Panel Viewports */}
        <div className="p-3 sm:p-6" role="tabpanel">
          {activeTab === "security" && (
            <div className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
              <div className={SETTINGS_TOKENS.card}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                      {t.settingsSecurityBadge ?? "Bảo mật nâng cao"}
                    </span>
                    <h3 className={`mt-3 text-xl font-semibold ${SETTINGS_TOKENS.text.strong}`}>
                      {t.settingsSecurityTitle ?? "Tiêu chuẩn bảo mật"}
                    </h3>
                    <p className={`mt-2 max-w-2xl text-sm leading-6 ${SETTINGS_TOKENS.text.muted}`}>
                      {t.settingsSecurityPanelDesc ?? "Manage authentication methods, passwords, and configure two-factor authentication."}
                    </p>
                  </div>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-amber-100 text-amber-700 shadow-sm ring-1 ring-amber-200/70 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20">
                    <Lock size={24} />
                  </div>
                </div>

                {isLoadingSecurity ? (
                  <div className="py-12 flex justify-center">
                    <PageLoader inline label="Loading security metrics..." />
                  </div>
                ) : (
                  <div className="mt-6 grid gap-3 lg:grid-cols-2">
                    {/* Isolated Sub-layout Section for password status */}
                    <PasswordSection
                      isPasswordSet={isPasswordSet}
                      onTriggerChange={openPasswordModal}
                      t={t}
                    />

                    {/* Isolated Sub-layout Section for 2FA toggles */}
                    <TwoFactorAuthSection
                      twoFactorEnabled={twoFactorEnabled}
                      onToggleChange={handleTwoFactorChange}
                      isLoading={isLoadingSecurity}
                      isSaving={isSaving2FA}
                      t={t}
                    />
                  </div>
                )}
              </div>

              {/* Side Status card */}
              <div className={`${SETTINGS_TOKENS.card} flex flex-col justify-between`}>
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                    <ShieldCheck size={22} />
                  </div>
                  <p className={`mt-4 text-xs font-semibold uppercase tracking-[0.18em] ${SETTINGS_TOKENS.text.muted}`}>
                    {t.settingsSecurityBadge ?? "BẢO MẬT"}
                  </p>
                  <h3 className={`mt-2 text-lg font-semibold ${SETTINGS_TOKENS.text.strong}`}>
                    {t.settingsSecurityPanelTitle ?? "Trạng thái bảo vệ"}
                  </h3>
                  <p className={`mt-2 text-sm leading-6 ${SETTINGS_TOKENS.text.muted}`}>
                    {t.settingsSecurityStrengthDesc ?? "Two-factor authorization adds an extra level of encryption."}
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 dark:border-slate-700/80 dark:bg-slate-900/50">
                    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${SETTINGS_TOKENS.text.muted}`}>
                      {t.settingsSecurityStrengthLabel ?? "Mức độ bảo vệ"}
                    </p>
                    <p
                      className={`mt-2 text-base font-semibold ${
                        twoFactorEnabled ? "text-teal-600 dark:text-teal-400" : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {twoFactorEnabled
                        ? (t.settingsSecurityLevelHigh ?? "Cao")
                        : (t.settingsSecurityLevelMedium ?? "Trung bình")}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 dark:border-slate-700/80 dark:bg-slate-900/50">
                    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${SETTINGS_TOKENS.text.muted}`}>
                      {t.settingsSecurityStatusLabel ?? "Trạng thái"}
                    </p>
                    <p
                      className={`mt-2 text-base font-semibold ${
                        twoFactorEnabled ? "text-teal-600 dark:text-teal-400" : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {twoFactorEnabled
                        ? (t.settingsSecurityStatusProtected ?? "Được bảo vệ")
                        : (t.settingsSecurityStatusWarning ?? "Cảnh báo")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <ActivityLogsSection activityLogs={ACTIVITY_LOGS} t={t} />
          )}

          {activeTab === "preferences" && (
            <PreferencesSection
              theme={theme}
              isThemeTransitioning={isThemeTransitioning}
              toggleTheme={toggleTheme}
              emailNotifications={emailNotifications}
              screenNotifications={screenNotifications}
              setEmailNotifications={setEmailNotifications}
              setScreenNotifications={setScreenNotifications}
              lang={lang}
              isLanguageTransitioning={isLanguageTransitioning}
              setLang={setLang}
              t={t}
            />
          )}

          {activeTab === "test" && (
            <div className={SETTINGS_TOKENS.card}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${SETTINGS_TOKENS.text.muted}`}>
                    Test
                  </p>
                  <h3 className={`mt-2 text-lg font-semibold ${SETTINGS_TOKENS.text.strong}`}>
                    Phone OTP Test
                  </h3>
                  <p className={`mt-2 text-sm leading-6 ${SETTINGS_TOKENS.text.muted}`}>
                    Test chức năng gửi và xác minh OTP qua điện thoại
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300">
                  <ShieldCheck size={22} />
                </div>
              </div>
              <div className="mt-6 text-sm text-slate-500">
                Chức năng gửi OTP qua điện thoại hiện đã được định cấu hình tự động.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Structured Modal Dialog trapped for A11y */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={closePasswordModal}
        onSuccess={handlePasswordSuccess}
        isPasswordSet={isPasswordSet}
      />
    </div>
  );
}
export default SettingsPage;
