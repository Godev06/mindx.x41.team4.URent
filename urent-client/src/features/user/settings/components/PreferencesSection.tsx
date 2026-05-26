import { useState } from "react";
import { MoonStar, BellRing, Activity, Languages, Volume2, Sliders, Smartphone } from "lucide-react";
import { SettingSwitch } from "./SettingSwitch";
import { PageLoader } from "../../shared/components/PageLoader";
import { SETTINGS_TOKENS } from "../utils/styleTokens";
import { useToast } from "../../shared/hooks/useToast";

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
  const { showToast } = useToast();

  // Khởi tạo trạng thái chuông báo & thông báo đẩy trình duyệt từ localStorage
  const [soundNotifications, setSoundNotifications] = useState(() => {
    return localStorage.getItem("settings.soundNotifications") !== "false";
  });

  const [pushNotifications, setPushNotifications] = useState(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission === "granted" && localStorage.getItem("settings.pushNotifications") !== "false";
    }
    return false;
  });

  const handleSoundToggle = (checked: boolean) => {
    setSoundNotifications(checked);
    localStorage.setItem("settings.soundNotifications", String(checked));
    showToast({
      title: "Cập nhật thành công",
      description: `Đã ${checked ? "bật" : "tắt"} âm thanh thông báo.`,
      variant: "success",
    });
  };

  const handlePushToggle = async (checked: boolean) => {
    if (checked) {
      // Yêu cầu quyền và lấy token FCM từ fcmService
      import("../../notifications/services/fcm").then(async ({ fcmService }) => {
        const token = await fcmService.requestPermissionAndGetToken();
        if (token) {
          setPushNotifications(true);
          localStorage.setItem("settings.pushNotifications", "true");
          showToast({
            title: "Đã bật thông báo đẩy",
            description: "Trình duyệt đã đăng ký nhận thông báo đẩy thành công.",
            variant: "success",
          });
        } else {
          setPushNotifications(false);
          showToast({
            title: "Cấp quyền thất bại",
            description: "Vui lòng cấp quyền thông báo trên cài đặt trình duyệt.",
            variant: "error",
          });
        }
      });
    } else {
      // Tắt push và hủy token FCM trên server
      import("../../notifications/services/fcm").then(async ({ fcmService }) => {
        await fcmService.revokeToken();
        setPushNotifications(false);
        localStorage.setItem("settings.pushNotifications", "false");
        showToast({
          title: "Đã tắt thông báo đẩy",
          description: "Đã hủy đăng ký nhận thông báo đẩy trình duyệt.",
          variant: "info",
        });
      });
    }
  };

  const testChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
      
      showToast({
        title: "Kiểm tra chuông",
        description: "Chuông thông báo pha lê đã phát thử thành công.",
        variant: "success",
      });
    } catch (err) {
      console.warn("Chime blocked:", err);
    }
  };

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
            {t.settingsPreferencesDesc ?? "Quản lý giao diện, ngôn ngữ và cấu hình nhận thông báo chung."}
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
                    Nhận thông tin cập nhật về đơn hàng, bảo mật và khuyến mãi qua email.
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
                    Hiển thị thông báo nổi in-app ngay lập tức khi đang hoạt động.
                  </p>
                </div>
              </div>
              <SettingSwitch
                checked={screenNotifications}
                onChange={setScreenNotifications}
              />
            </div>
          </div>

          {/* Push Notifications Switch */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700/80 dark:bg-slate-900/50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                  <Smartphone size={18} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${SETTINGS_TOKENS.text.strong}`}>
                    Thông báo đẩy trình duyệt (Web Push)
                  </p>
                  <p className={`mt-1 text-xs ${SETTINGS_TOKENS.text.muted}`}>
                    Nhận thông báo thực của hệ điều hành ngay cả khi bạn đóng tab.
                  </p>
                </div>
              </div>
              <SettingSwitch
                checked={pushNotifications}
                onChange={handlePushToggle}
              />
            </div>
          </div>

          {/* Sound Chime Toggle & Test */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700/80 dark:bg-slate-900/50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                  <Volume2 size={18} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${SETTINGS_TOKENS.text.strong}`}>
                    Âm thanh thông báo (Audio Chime)
                  </p>
                  <p className={`mt-1 text-xs ${SETTINGS_TOKENS.text.muted}`}>
                    Phát chuông báo pha lê dual-tone khi có thông báo mới.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={testChime}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 transition cursor-pointer"
                >
                  Nghe thử
                </button>
                <SettingSwitch
                  checked={soundNotifications}
                  onChange={handleSoundToggle}
                />
              </div>
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
                Áp dụng ngôn ngữ hiển thị trên toàn bộ các màn hình ứng dụng.
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
