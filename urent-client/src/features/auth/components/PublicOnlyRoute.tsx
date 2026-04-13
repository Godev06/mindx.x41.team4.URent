import { Navigate, Outlet } from "react-router-dom";
import { APP_ROUTES } from "../constants";
import { useAuth } from "../hooks/useAuth";
import { PageLoader } from "../../shared/components/PageLoader";
import { useI18n } from "../../shared/context/LanguageContext";

export function PublicOnlyRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { t } = useI18n();

  if (isInitializing) {
    return <PageLoader fullScreen label={t.loadingSession} />;
  }

  if (isAuthenticated) {
    return <Navigate to={APP_ROUTES.home} replace />;
  }

  return <Outlet />;
}
