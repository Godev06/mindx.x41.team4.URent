import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
<<<<<<< HEAD
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
import { AppShell } from "./features/user/layout/components/AppShell";
import { ProtectedRoute } from "./features/user/auth/components/ProtectedRoute";
import { PublicOnlyRoute } from "./features/user/auth/components/PublicOnlyRoute";
import { ForgotPasswordPage } from "./features/user/auth/pages/ForgotPasswordPage";
import { LoginPage } from "./features/user/auth/pages/LoginPage";
import { RegisterPage } from "./features/user/auth/pages/RegisterPage";
import { ResetPasswordPage } from "./features/user/auth/pages/ResetPasswordPage";
import { VerifyOtpPage } from "./features/user/auth/pages/VerifyOtpPage";
import { APP_ROUTES } from "./features/user/auth/constants";
=======
import { HomePage } from "./features/home/pages/HomePage";
import { InventoryPage } from "./features/inventory/pages/InventoryPage";
import { OrderDetailPage } from "./features/orders/pages/OrderDetailPage";
import { OrdersPage } from "./features/orders/pages/OrdersPage";
import { MessagesPage } from "./features/messages/pages/MessagesPage";
import { NotificationsPage } from "./features/notifications/pages/NotificationsPage";
import { SettingsPage } from "./features/settings/pages/SettingsPage";
import { ProfilePage } from "./features/profile/pages/ProfilePage";
import { ProductDetailPage } from "./features/product/pages/ProductDetailPage";
import { AppShell } from "./features/layout/components/AppShell";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { PublicOnlyRoute } from "./features/auth/components/PublicOnlyRoute";
import { ForgotPasswordPage } from "./features/auth/pages/ForgotPasswordPage";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { ResetPasswordPage } from "./features/auth/pages/ResetPasswordPage";
import { VerifyOtpPage } from "./features/auth/pages/VerifyOtpPage";
import { APP_ROUTES } from "./features/auth/constants";
import { NAV_PATHS } from "./features/layout/constants/navItems";
>>>>>>> 21136e37f59cee37628f3ad87c2e8a29f27c18f3

function ProductRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const parsedId = Number(id);
  const safeId = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : 1;

  return (
    <ProductDetailPage
      productId={safeId}
      onBack={() => navigate(APP_ROUTES.home)}
    />
  );
}

export default function App() {
  const navigate = useNavigate();
  const handleProductClick = (id: number) => {
    navigate(`/product/${id}`);
  };

  return (
    <Routes>
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

<<<<<<< HEAD
      {/* Main Layout routes */}
      <Route element={<AppShell />}>
        {/* Public routes — accessible without login */}
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

        {/* Protected routes — require login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:id" element={<MessagesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
=======
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route
            path={APP_ROUTES.home}
            element={<HomePage onProductClick={handleProductClick} />}
          />
          <Route path={NAV_PATHS.orders} element={<OrdersPage />} />
          <Route
            path={`${NAV_PATHS.orders}/:orderId`}
            element={<OrderDetailPage />}
          />
          <Route path={NAV_PATHS.inventory} element={<InventoryPage />} />
          <Route path={NAV_PATHS.messages} element={<MessagesPage />} />
          <Route
            path={`${NAV_PATHS.messages}/:id`}
            element={<MessagesPage />}
          />
          <Route
            path={NAV_PATHS.notifications}
            element={<NotificationsPage />}
          />
          <Route path={NAV_PATHS.settings} element={<SettingsPage />} />
>>>>>>> 21136e37f59cee37628f3ad87c2e8a29f27c18f3
          <Route path={APP_ROUTES.profile} element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={APP_ROUTES.home} replace />} />
    </Routes>
  );
}
