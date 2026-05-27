import { useState, useEffect } from "react";
import { MoonStar, BellRing, Activity, Languages, Volume2, Sliders, Smartphone, Volume1, VolumeX, Music, Check } from "lucide-react";
import { SettingSwitch } from "./SettingSwitch";
import { PageLoader } from "../../shared/components/PageLoader";
import { SETTINGS_TOKENS } from "../utils/styleTokens";
import { useToast } from "../../shared/hooks/useToast";
import { getStoredAuthToken } from "../../../../lib/api/tokenStorage";
import { notificationService } from "../../notifications/services/notificationService";
import { audioChimeService, type ChimeStyle } from "../../notifications/services/audioChimeService";

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

  const [selectedStyle, setSelectedStyle] = useState<ChimeStyle>(() => audioChimeService.getStyle());
  const [selectedVolume, setSelectedVolume] = useState<number>(() => audioChimeService.getVolume());

  const handleStyleChange = (style: ChimeStyle) => {
    setSelectedStyle(style);
    audioChimeService.setStyle(style);
    audioChimeService.playChime(style, selectedVolume);
  };

  const handleVolumeChange = (vol: number) => {
    setSelectedVolume(vol);
    audioChimeService.setVolume(vol);
  };

  useEffect(() => {
    const token = getStoredAuthToken();
    if (!token) return;

    notificationService.getNotificationSettings()
      .then((res) => {
        if (res.data) {
          if (res.data.soundNotifications !== undefined) {
            setSoundNotifications(res.data.soundNotifications);
            localStorage.setItem("settings.soundNotifications", String(res.data.soundNotifications));
          }
          if (res.data.pushNotifications !== undefined) {
            setPushNotifications(res.data.pushNotifications);
            localStorage.setItem("settings.pushNotifications", String(res.data.pushNotifications));
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load settings in PreferencesSection:", err);
      });
  }, []);

  const handleSoundToggle = (checked: boolean) => {
    setSoundNotifications(checked);
    localStorage.setItem("settings.soundNotifications", String(checked));
    const token = getStoredAuthToken();
    if (token) {
      notificationService.updateNotificationSettings({ soundNotifications: checked }).catch((err) => {
        console.error("Failed to update soundNotifications on BE:", err);
      });
    }
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
          const authToken = getStoredAuthToken();
          if (authToken) {
            notificationService.updateNotificationSettings({ pushNotifications: true }).catch((err) => {
              console.error("Failed to update pushNotifications on BE:", err);
            });
          }
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
        const authToken = getStoredAuthToken();
        if (authToken) {
          notificationService.updateNotificationSettings({ pushNotifications: false }).catch((err) => {
            console.error("Failed to update pushNotifications on BE:", err);
          });
        }
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
      audioChimeService.playChime(selectedStyle, selectedVolume);

      const styleNameMap: Record<ChimeStyle, string> = {
        crystal: "Chuông Pha Lê",
        electronic: "Chuông Hiện Đại",
        arpeggio: "Chuông Vui Tươi",
        minimal: "Chuông Tinh Giản",
      };

      showToast({
        title: "Kiểm tra chuông",
        description: `Chuông thông báo "${styleNameMap[selectedStyle]}" đã phát thử thành công.`,
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

          {/* Sound Chime Toggle, Style Grid & Volume Slider */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700/80 dark:bg-slate-900/50 space-y-4">
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
                    Phát chuông báo tùy chọn khi nhận được thông báo mới thời gian thực.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={testChime}
                  disabled={!soundNotifications}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 disabled:text-slate-400 dark:text-teal-400 dark:hover:text-teal-300 dark:disabled:text-slate-600 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 disabled:bg-slate-50 dark:disabled:bg-slate-900/50 transition cursor-pointer disabled:cursor-not-allowed shadow-xs"
                >
                  Nghe thử
                </button>
                <SettingSwitch
                  checked={soundNotifications}
                  onChange={handleSoundToggle}
                />
              </div>
            </div>

            {/* Expandable Chime Configuration Controls */}
            <div
              className={`pt-2 border-t border-slate-200/60 dark:border-slate-800/80 space-y-4 transition-all duration-300 ${soundNotifications ? "opacity-100" : "opacity-40 pointer-events-none"
                }`}
            >
              {/* Chime Style Selector Grid */}
              <div className="space-y-2">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${SETTINGS_TOKENS.text.muted}`}>
                  Phong cách âm thanh
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(["crystal", "electronic", "arpeggio", "minimal"] as ChimeStyle[]).map((style) => {
                    const styleMeta = {
                      crystal: { label: "Pha lê", desc: "Mặc định dual-tone", icon: Music, color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10" },
                      electronic: { label: "Hiện đại", desc: "Cyber synth ping", icon: Sliders, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" },
                      arpeggio: { label: "Vui tươi", desc: "Ascending arpeggio", icon: Activity, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" },
                      minimal: { label: "Tinh giản", desc: "Sinewave chirp", icon: Smartphone, color: "text-sky-500 bg-sky-50 dark:bg-sky-500/10" },
                    }[style];

                    const IconComponent = styleMeta.icon;
                    const isActive = selectedStyle === style;

                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => handleStyleChange(style)}
                        disabled={!soundNotifications}
                        className={`group relative flex flex-col text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer ${isActive
                          ? "border-teal-500 bg-teal-50/20 dark:bg-teal-500/5 shadow-xs"
                          : "border-slate-200/60 bg-white/40 hover:border-slate-300 dark:border-slate-800/60 dark:bg-slate-900/20 dark:hover:border-slate-700"
                          }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className={`p-1.5 rounded-lg ${styleMeta.color}`}>
                            <IconComponent size={14} />
                          </div>
                          {isActive && (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-white dark:bg-teal-400">
                              <Check size={10} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <p className={`mt-2 text-xs font-semibold ${SETTINGS_TOKENS.text.strong}`}>
                          {styleMeta.label}
                        </p>
                        <p className="mt-0.5 text-[10px] leading-tight text-slate-400 dark:text-slate-500">
                          {styleMeta.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chime Volume Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${SETTINGS_TOKENS.text.muted}`}>
                    Mức âm lượng
                  </label>
                  <span className={`text-xs font-semibold ${SETTINGS_TOKENS.text.strong}`}>
                    {Math.round(selectedVolume * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-white/40 dark:bg-slate-900/20 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <div className="shrink-0 text-slate-500 dark:text-slate-400 transition-colors">
                    {selectedVolume === 0 ? (
                      <VolumeX size={18} />
                    ) : selectedVolume < 0.4 ? (
                      <Volume1 size={18} />
                    ) : (
                      <Volume2 size={18} />
                    )}
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedVolume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    onMouseUp={() => audioChimeService.playChime(selectedStyle, selectedVolume)}
                    onTouchEnd={() => audioChimeService.playChime(selectedStyle, selectedVolume)}
                    disabled={!soundNotifications}
                    className="flex-1 h-1.5 rounded-lg appearance-none bg-slate-200 dark:bg-slate-700 accent-teal-600 dark:accent-teal-400 cursor-pointer disabled:cursor-not-allowed"
                    style={{
                      background: `linear-gradient(to right, #0d9488 0%, #0d9488 ${selectedVolume * 100}%, ${theme === "dark" ? "#334155" : "#cbd5e1"} ${selectedVolume * 100}%)`
                    }}
                  />
                </div>
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
