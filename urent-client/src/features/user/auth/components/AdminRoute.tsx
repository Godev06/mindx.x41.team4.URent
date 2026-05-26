import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../auth/hooks/useAuth";

export function AdminRoute() {
  const { user, isInitializing } = useAuth();

  if (isInitializing) {
    return null;
  }

  //   if (user?.role !== "admin") {
  //     return <Navigate to="/" replace />;
  //   }

  return <Outlet />;
}
