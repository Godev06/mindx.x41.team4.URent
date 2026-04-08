import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { AppHeader } from "./features/layout/components/AppHeader";
import { AppSidebar } from "./features/layout/components/AppSidebar";
import { HomePage } from "./features/home/pages/HomePage";
import { InventoryPage } from "./features/inventory/pages/InventoryPage";
import { OrderDetailPage } from "./features/orders/pages/OrderDetailPage";
import { OrdersPage } from "./features/orders/pages/OrdersPage";
import { MessagesPage } from "./features/messages/pages/MessagesPage";
import { ProductDetailPage } from "./features/product/pages/ProductDetailPage";

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
    <div className="flex min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      <AppSidebar />

      <main className="min-h-screen w-full flex-1 pl-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="sticky top-0 z-30 -mx-4 border-b border-slate-200/70 bg-slate-50/85 px-4 py-5 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
            <AppHeader />
          </div>
          <div className="mt-4">
          <Routes>
            <Route path="/" element={<HomePage onProductClick={handleProductClick} />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/product/:id" element={<ProductRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </div>
        </div>
      </main>
    </div>
  );
}
