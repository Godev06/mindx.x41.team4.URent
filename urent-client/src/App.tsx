import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";

import { HomePage } from "./features/user/home/pages/HomePage";
import { ProductListingPage } from "./features/user/home/pages/ProductListingPage";
import InventoryPage from "./features/user/inventory/pages/InventoryPage";
import { OrderDetailPage } from "./features/user/orders/pages/OrderDetailPage";
import { OrdersPage } from "./features/user/orders/pages/OrdersPage";
import { MessagesPage } from "./features/user/messages/pages/MessagesPage";
import { NotificationsPage } from "./features/user/notifications/pages/NotificationsPage";
import { SettingsPage } from "./features/user/settings/pages/SettingsPage";
import { ProfilePage } from "./features/user/profile/pages/ProfilePage";
import { ProductDetailPage } from "./features/user/product/pages/ProductDetailPage";

// --- IMPORT COMPONENT WISHLIST PAGE MỚI ---
import { WishlistPage } from "./features/user/profile/pages/WishlistPage"; 

import { AppShell } from "./features/user/layout/components/AppShell";
import { ProtectedRoute } from "./features/user/auth/components/ProtectedRoute";
import { PublicOnlyRoute } from "./features/user/auth/components/PublicOnlyRoute";
import { AdminRoute } from "./features/user/auth/components/AdminRoute";
import { ForgotPasswordPage } from "./features/user/auth/pages/ForgotPasswordPage";
import { LoginPage } from "./features/user/auth/pages/LoginPage";
import { RegisterPage } from "./features/user/auth/pages/RegisterPage";
import { ResetPasswordPage } from "./features/user/auth/pages/ResetPasswordPage";
import { VerifyOtpPage } from "./features/user/auth/pages/VerifyOtpPage";
import { APP_ROUTES } from "./features/user/auth/constants";

import { AdminDashboardPage } from "./features/admin/pages/AdminDashboardPage";
import { AdminLogsPage } from "./features/admin/pages/AdminLogsPage";
import { AdminOrdersDetailPage } from "./features/admin/pages/AdminOrdersDetailPage";
import { AdminOrdersPage } from "./features/admin/pages/AdminOrdersPage";
import { AdminUsersPage } from "./features/admin/pages/AdminUsersPage";
import { AdminChatPage } from "./features/admin/pages/AdminChatPage";
import { AdminBroadcastCenter } from "./features/admin/pages/AdminBroadcastCenter";

// IMPORT SocketProvider từ file hook .ts của bạn vào đây
import { SocketProvider } from "./features/user/messages/hooks/useSocket";

function ProductRoute() {
  const { id } = useParams();

  const navigate = useNavigate();
  const isObjectId = id && id.length === 24 && /^[0-9a-fA-F]+$/.test(id);
  const parsedId = isObjectId ? id : (id && !isNaN(Number(id)) ? Number(id) : id);

  return (
    <ProductDetailPage
      productId={parsedId ?? null}
      onBack={() => navigate(APP_ROUTES.home)}
    />
  );
}

export default function App() {
  const navigate = useNavigate();
  const handleProductClick = (id: string | number) => {
    navigate(`/product/${id}`);
  };

  return (
    <SocketProvider>
      <Routes>
        {/* PUBLIC ONLY */}
        <Route element={<PublicOnlyRoute />}>
          <Route path={APP_ROUTES.login} element={<LoginPage />} />
          <Route path={APP_ROUTES.register} element={<RegisterPage />} />
          <Route path={APP_ROUTES.authOtp} element={<VerifyOtpPage />} />
          <Route
            path={APP_ROUTES.forgotPassword}
            element={<ForgotPasswordPage />}
          />
          <Route
            path={APP_ROUTES.resetPassword}
            element={<ResetPasswordPage />}
          />
        </Route>

        {/* MAIN LAYOUT */}
        <Route element={<AppShell />}>
          {/* PUBLIC */}
          <Route
            path={APP_ROUTES.home}
            element={<HomePage onProductClick={handleProductClick} />}
          />
          <Route
            path="/products"
            element={
              <ProductListingPage
                onProductClick={handleProductClick}
                onBack={() => navigate("/")}
              />
            }
          />
          <Route path="/product/:id" element={<ProductRoute />} />

          {/* PROTECTED */}
          <Route element={<ProtectedRoute />}>
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            
            {/* --- THÊM ROUTE CHO TRANG WISHLIST --- */}
            <Route path="/wishlist" element={<WishlistPage />} />

            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:id" element={<MessagesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path={APP_ROUTES.profile} element={<ProfilePage />} />
          </Route>
        </Route>

        {/* ADMIN */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/orders/:id" element={<AdminOrdersDetailPage />} />
            <Route path="/admin/chat" element={<AdminChatPage />} />
            <Route path="/admin/logs" element={<AdminLogsPage />} />
            <Route path="/admin/broadcast" element={<AdminBroadcastCenter />} />
          </Route>
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to={APP_ROUTES.home} replace />} />
      </Routes>
    </SocketProvider>
  );
}