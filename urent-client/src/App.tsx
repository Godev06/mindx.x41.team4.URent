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
import { AppShell } from "./features/user/layout/components/AppShell";
import { ProtectedRoute } from "./features/user/auth/components/ProtectedRoute";
import { PublicOnlyRoute } from "./features/user/auth/components/PublicOnlyRoute";
import { ForgotPasswordPage } from "./features/user/auth/pages/ForgotPasswordPage";
import { LoginPage } from "./features/user/auth/pages/LoginPage";
import { RegisterPage } from "./features/user/auth/pages/RegisterPage";
import { ResetPasswordPage } from "./features/user/auth/pages/ResetPasswordPage";
import { VerifyOtpPage } from "./features/user/auth/pages/VerifyOtpPage";
import { APP_ROUTES } from "./features/user/auth/constants";

function ProductRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const parsedId = Number(id);
  const safeId = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : 1;

  return <ProductDetailPage productId={safeId} onBack={() => navigate("/")} />;
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
          <Route path={APP_ROUTES.profile} element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={APP_ROUTES.home} replace />} />
    </Routes>
  );
}
