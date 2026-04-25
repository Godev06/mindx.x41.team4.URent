import { AlertCircle, ArrowRight, X } from "lucide-react";
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

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="relative overflow-hidden rounded-[24px] border border-teal-200/50 bg-teal-50/50 p-4 ring-1 ring-teal-900/5 backdrop-blur-md dark:border-teal-500/20 dark:bg-teal-500/5 dark:ring-white/5">
        {/* Background decorative elements */}
        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-teal-500/10 blur-xl" />
        <div className="absolute -bottom-4 left-1/4 h-12 w-12 rounded-full bg-teal-500/5 blur-lg" />
        
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-teal-900 dark:text-teal-100">
                {t.profileIncompleteTitle || "Hồ sơ của bạn chưa hoàn tất"}
              </p>
              <p className="text-xs text-teal-700/80 dark:text-teal-400/80">
                {t.profileIncompleteDesc || "Hãy cập nhật số điện thoại và giới thiệu bản thân để tăng độ tin cậy khi thuê đồ."}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              to={APP_ROUTES.profile}
              className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 hover:scale-[1.02] active:scale-[0.98]"
            >
              {t.settingsEdit || "Cập nhật ngay"}
              <ArrowRight size={14} />
            </Link>
            <button
              onClick={handleDismiss}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-teal-700/50 transition hover:bg-teal-500/10 hover:text-teal-700 dark:text-teal-400/50 dark:hover:text-teal-300"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
