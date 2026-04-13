import { Navigate, Outlet, useLocation } from "react-router-dom";
import { APP_ROUTES } from "../constants";
import { useAuth } from "../hooks/useAuth";
import { useI18n } from "../../shared/context/LanguageContext";

export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isInitializing } = useAuth();
  const { t } = useI18n();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto w-[95%] py-5">
          <div className="h-14 animate-pulse rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-700/80 dark:bg-slate-800/70" />
        </div>

        <div className="mx-auto grid w-[95%] gap-4 pb-8 md:grid-cols-12">
          <div className="space-y-4 md:col-span-8">
            <div className="h-40 animate-pulse rounded-3xl border border-slate-200/80 bg-white/80 dark:border-slate-700/80 dark:bg-slate-800/70" />
            <div className="h-56 animate-pulse rounded-3xl border border-slate-200/80 bg-white/80 dark:border-slate-700/80 dark:bg-slate-800/70" />
          </div>

          <div className="space-y-4 md:col-span-4">
            <div className="h-28 animate-pulse rounded-3xl border border-slate-200/80 bg-white/80 dark:border-slate-700/80 dark:bg-slate-800/70" />
            <div className="h-28 animate-pulse rounded-3xl border border-slate-200/80 bg-white/80 dark:border-slate-700/80 dark:bg-slate-800/70" />
            <div className="h-28 animate-pulse rounded-3xl border border-slate-200/80 bg-white/80 dark:border-slate-700/80 dark:bg-slate-800/70" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={APP_ROUTES.login}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}
