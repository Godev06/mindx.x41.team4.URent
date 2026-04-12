import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { HomePage } from "./features/home/pages/HomePage";
import { InventoryPage } from "./features/inventory/pages/InventoryPage";
import { OrderDetailPage } from "./features/orders/pages/OrderDetailPage";
import { OrdersPage } from "./features/orders/pages/OrdersPage";
import { MessagesPage } from "./features/messages/pages/MessagesPage";
import { NotificationsPage } from "./features/notifications/pages/NotificationsPage";
import { SettingsPage } from "./features/settings/pages/SettingsPage";
import { ProfilePage } from "./features/profile/pages/ProfilePage";
import { ProductDetailPage } from "./features/product/pages/ProductDetailPage";
import { ContactPage } from "./features/contact/pages/ContactPage";
import { AppShell } from "./features/layout/components/AppShell";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { PublicOnlyRoute } from "./features/auth/components/PublicOnlyRoute";
import { ForgotPasswordPage } from "./features/auth/pages/ForgotPasswordPage";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { ResetPasswordPage } from "./features/auth/pages/ResetPasswordPage";
import { VerifyRegisterOtpPage } from "./features/auth/pages/VerifyRegisterOtpPage";
import { APP_ROUTES } from "./features/auth/constants";

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
        <Route
          path={APP_ROUTES.registerVerifyOtp}
          element={<VerifyRegisterOtpPage />}
        />
        <Route
          path={APP_ROUTES.forgotPassword}
          element={<ForgotPasswordPage />}
        />
        <Route
          path={APP_ROUTES.resetPassword}
          element={<ResetPasswordPage />}
        />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route
            path={APP_ROUTES.home}
            element={<HomePage onProductClick={handleProductClick} />}
          />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:id" element={<MessagesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path={APP_ROUTES.profile} element={<ProfilePage />} />
          <Route path="/product/:id" element={<ProductRoute />} />
          <Route path={APP_ROUTES.contact} element={<ContactPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={APP_ROUTES.home} replace />} />
    </Routes>
  );
}
