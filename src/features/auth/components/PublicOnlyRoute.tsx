import { Navigate, Outlet } from "react-router-dom";
import { APP_ROUTES } from "../constants";
import { useAuth } from "../hooks/useAuth";
import { PageLoader } from "../../shared/components/PageLoader";

export function PublicOnlyRoute() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <PageLoader fullScreen label="Dang tai thong tin phien lam viec..." />
    );
  }

  if (isAuthenticated) {
    return <Navigate to={APP_ROUTES.home} replace />;
  }

  return <Outlet />;
}
