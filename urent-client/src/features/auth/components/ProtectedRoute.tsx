import { Navigate, Outlet, useLocation } from "react-router-dom";
import { APP_ROUTES } from "../constants";
import { useAuth } from "../hooks/useAuth";
import { PageLoader } from "../../shared/components/PageLoader";

export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <PageLoader fullScreen label="Dang xac thuc phien lam viec..." />;
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
