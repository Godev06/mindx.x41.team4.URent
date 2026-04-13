import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";
import { useTheme } from "../../settings/hooks/useTheme";
import { PageLoader } from "../../shared/components/PageLoader";
import { useI18n } from "../../shared/context/LanguageContext";

export function AppShell() {
  const location = useLocation();
  const { isThemeTransitioning } = useTheme();
  const { t, isLanguageTransitioning } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const firstUpdate = useRef(true);

  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }

    const showTimer = window.setTimeout(() => {
      setIsLoading(true);
    }, 0);
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, 200);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(timer);
    };
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 selection:bg-teal-100 selection:text-teal-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-teal-100/60 via-white/40 to-transparent dark:from-teal-500/10 dark:via-slate-900/20 dark:to-transparent" />
      <div
        className={`pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-white/35 backdrop-blur-[2px] transition-all duration-300 dark:bg-slate-950/35 ${
          isThemeTransitioning || isLoading || isLanguageTransitioning
            ? "opacity-100"
            : "opacity-0"
        }`}
        aria-hidden={
          !isThemeTransitioning && !isLoading && !isLanguageTransitioning
        }
      >
        <PageLoader
          label={
            isLanguageTransitioning
              ? t.settingsLanguageApplying
              : t.loadingTransition
          }
          hideLabel
        />
      </div>
      <main className="relative min-h-screen">
        <div className="sticky top-0 z-30 py-5">
          <div className="mx-auto w-[95%]">
            <AppHeader />
          </div>
        </div>

        <div className="mx-auto w-[95%]">
          <div className="pb-8">
            <Outlet />
          </div>
        </div>
        <AppFooter />
      </main>
    </div>
  );
}
