import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../auth/hooks/useAuth";

const ADMIN_EMAILS = [
  "phamtuananh25062004@gmail.com",
  "tuananhfredd@gmail.com",
  "contact.urent.vn@gmail.com",
  "nguyentrongtiendev06@gmail.com",
  "tiengarena2k@gmail.com",
];

export function AdminRoute() {
  const { user, isInitializing, isAuthenticated } = useAuth();

  if (isInitializing) {
    return <div className="min-h-screen bg-[#020817]" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const isAdmin = user.role === "admin" || ADMIN_EMAILS.includes(user.email.toLowerCase());

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
