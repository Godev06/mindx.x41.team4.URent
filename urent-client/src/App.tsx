import { Bell, LayoutGrid, MessageSquare, Package, Search, ShoppingCart } from "lucide-react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { SidebarItem } from "./features/shared/components/SidebarItem";
import { HomePage } from "./features/home/pages/HomePage";
import { InventoryPage } from "./features/inventory/pages/InventoryPage";
import { OrdersPage } from "./features/orders/pages/OrdersPage";
import { MessagesPage } from "./features/messages/pages/MessagesPage";
import { ProductDetailPage } from "./features/product/pages/ProductDetailPage";

type AppTab = "home" | "orders" | "inventory" | "messages" | "product";

function ProductRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const parsedId = Number(id);
  const safeId = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : 1;

  return <ProductDetailPage productId={safeId} onBack={() => navigate("/")} />;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleProductClick = (id: number) => {
    navigate(`/product/${id}`);
  };

  const syncTabFromPath = (pathname: string): AppTab => {
    if (pathname.startsWith("/orders")) return "orders";
    if (pathname.startsWith("/inventory")) return "inventory";
    if (pathname.startsWith("/messages")) return "messages";
    if (pathname.startsWith("/product/")) return "product";
    return "home";
  };

  const currentTab = syncTabFromPath(location.pathname);

  const goTo = (path: string) => navigate(path);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100">
      <aside className="fixed left-0 top-0 bottom-0 w-20 bg-white border-r border-gray-100 flex flex-col items-center py-8 z-30">
        <div
          onClick={() => goTo("/")}
          className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl mb-12 shadow-lg shadow-blue-100 cursor-pointer transition-transform hover:rotate-6"
        >
          U
        </div>

        <nav className="flex-1 w-full space-y-4">
          <SidebarItem icon={LayoutGrid} label="Trang chu" active={currentTab === "home" || currentTab === "product"} onClick={() => goTo("/")} />
          <SidebarItem icon={ShoppingCart} label="Don hang" active={currentTab === "orders"} onClick={() => goTo("/orders")} />
          <SidebarItem icon={Package} label="Kho" active={currentTab === "inventory"} onClick={() => goTo("/inventory")} />
          <SidebarItem icon={MessageSquare} label="Tin nhan" active={currentTab === "messages"} onClick={() => goTo("/messages")} />
        </nav>
      </aside>

      <main className="flex-1 ml-20 p-4 md:p-8 lg:px-12 max-w-7xl mx-auto w-full min-h-screen">
        <header className="flex justify-between items-center mb-8 gap-4">
          <div className="relative flex-1 max-w-xl group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Tim may anh, laptop, hoac ma don hang..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-300 transition-all outline-none text-sm"
            />
          </div>
          <button className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all relative">
            <Bell size={20} />
            <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </header>

        <Routes>
          <Route path="/" element={<HomePage onProductClick={handleProductClick} />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/product/:id" element={<ProductRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
