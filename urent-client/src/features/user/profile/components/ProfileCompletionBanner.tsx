import { Sparkles, ArrowRight, X, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { useI18n } from "../../shared/context/LanguageContext";
import { APP_ROUTES } from "../../auth/constants";

export function ProfileCompletionBanner() {
  const { user } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem("profile_banner_dismissed") === "true";
  });

  useEffect(() => {
    if (!user || isDismissed || location.pathname === APP_ROUTES.profile) {
      setIsVisible(false);
      return;
    }

    const isIncomplete = !user.phone || !user.bio;
    setIsVisible(isIncomplete);
  }, [user, isDismissed, location.pathname]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("profile_banner_dismissed", "true");
  };

  if (!isVisible) return null;

  // Dynamic progress calculation to motivate conversion
  const phoneFilled = !!user?.phone;
  const bioFilled = !!user?.bio;
  const avatarFilled = !!user?.avatarUrl;

  let completionPercentage = 50;
  if (phoneFilled) completionPercentage += 20;
  if (bioFilled) completionPercentage += 15;
  if (avatarFilled) completionPercentage += 15;

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-5 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md transition-all duration-300 hover:shadow-md dark:border-white/10 dark:bg-slate-900/65 dark:ring-white/5">
        {/* Subtle premium background gradient accents */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-linear-to-br from-teal-400/20 to-cyan-500/20 blur-xl dark:from-teal-500/10 dark:to-cyan-600/10" />
        <div className="pointer-events-none absolute -bottom-6 left-1/3 h-16 w-16 rounded-full bg-linear-to-br from-teal-300/10 to-transparent blur-lg dark:from-teal-500/5" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex flex-1 items-start gap-3.5 sm:items-center">
            {/* Sparkling success badge icon instead of error exclamation */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 text-teal-600 shadow-xs ring-1 ring-teal-500/20 dark:from-teal-500/15 dark:to-cyan-500/15 dark:text-teal-400 dark:ring-teal-500/25">
              <Sparkles size={20} strokeWidth={2} className="animate-pulse" />
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <p className="text-sm font-bold text-slate-800 dark:text-white leading-snug">
                  {t.profileIncompleteTitle || "Hồ sơ của bạn gần hoàn tất"}
                </p>
                {/* Visual Onboarding Progress Badge */}
                <span className="inline-flex items-center gap-1 self-start rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                  <ShieldCheck size={11} strokeWidth={2.5} />
                  Hoàn thành {completionPercentage}%
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400 max-w-2xl">
                {t.profileIncompleteDesc || "Hoàn tất giới thiệu bản thân để nâng cao mức độ tin cậy và được chủ sở hữu duyệt yêu cầu thuê nhanh hơn."}
              </p>

              {/* Motivator Progress Bar */}
              <div className="mt-3 flex items-center gap-2.5">
                <div className="h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-700 ease-out"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                {!phoneFilled && (
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    +20% thêm số điện thoại
                  </span>
                )}
                {phoneFilled && !bioFilled && (
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    +15% giới thiệu bản thân
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 border-t border-slate-100 sm:pt-0 sm:border-0 dark:border-slate-800">
            <Link
              to={APP_ROUTES.profile}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 px-4.5 py-2.5 text-xs font-bold text-white shadow-lg shadow-teal-500/15 transition-all duration-200 hover:from-teal-700 hover:to-teal-600 hover:scale-[1.02] hover:shadow-teal-500/25 active:scale-[0.98]"
            >
              {t.settingsEdit || "Tăng độ tin cậy"}
              <ArrowRight size={13} strokeWidth={2.5} />
            </Link>
            <button
              onClick={handleDismiss}
              aria-label="Đóng thông báo"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 text-slate-400 transition hover:border-slate-200 hover:bg-slate-100 hover:text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
