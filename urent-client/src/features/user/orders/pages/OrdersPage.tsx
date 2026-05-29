import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ORDERS } from "../../dataset/orders";
import { PRODUCTS } from "../../dataset/products";
import { OrderCard } from "../components/OrderCard";
import { useTheme } from "../../settings/hooks/useTheme";
import { useI18n } from "../../shared/context/LanguageContext";
import { useAuth } from "../../auth/hooks/useAuth";
import { apiClient } from "../../../../lib/api/apiClient";

export function OrdersPage() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      if (!isAuthenticated) {
        setOrders(ORDERS);
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const response = await apiClient.get("/api/v1/orders");
        const mapped = response.data.data.map((ord: any) => ({
          id: ord.orderCode || ord._id,
          _id: ord._id,
          productId: ord.productId?._id || ord.productId || "",
          productName: ord.productName,
          customerName: ord.customerName,
          startDate: new Date(ord.startDate).toLocaleDateString("vi-VN"),
          endDate: new Date(ord.endDate).toLocaleDateString("vi-VN"),
          totalPrice: ord.totalPrice,
          status: ord.status,
          imageUrl: ord.productId?.imageUrl || ord.imageUrl || "",
          image: "🛒",
        }));
        setOrders(mapped);
      } catch (err) {
        console.error("Failed to fetch real orders, falling back to mock:", err);
        setOrders(ORDERS);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, [isAuthenticated]);

  const activeOrders = orders.filter(
    (item) =>
      item.status === "pending" ||
      item.status === "confirmed" ||
      item.status === "shipped",
  ).length;
  const completedOrders = orders.filter(
    (item) => item.status === "delivered",
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1
          className={`text-2xl font-bold tracking-tight ${
            theme === "dark" ? "text-slate-100" : "text-slate-900"
          }`}
        >
          {t.ordersTitle}
        </h1>
        <p
          className={`mt-1 text-sm ${
            theme === "dark" ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {t.ordersDesc}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <div
          className={`rounded-2xl border p-4 shadow-sm ring-1 ${
            theme === "dark"
              ? "border-slate-700 bg-slate-900 ring-white/10"
              : "border-slate-200/90 bg-white ring-slate-900/4"
          }`}
        >
          <p
            className={`text-xs font-medium ${
              theme === "dark" ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {t.ordersActive}
          </p>
          <p
            className={`mt-2 text-2xl font-bold ${
              theme === "dark" ? "text-slate-100" : "text-slate-900"
            }`}
          >
            {activeOrders}
          </p>
        </div>
        <div
          className={`rounded-2xl border p-4 shadow-sm ring-1 ${
            theme === "dark"
              ? "border-slate-700 bg-slate-900 ring-white/10"
              : "border-slate-200/90 bg-white ring-slate-900/4"
          }`}
        >
          <p
            className={`text-xs font-medium ${
              theme === "dark" ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {t.ordersDone}
          </p>
          <p
            className={`mt-2 text-2xl font-bold ${
              theme === "dark" ? "text-slate-100" : "text-slate-900"
            }`}
          >
            {completedOrders}
          </p>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {t.ordersRecent}
        </h2>
        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-tight text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          {t.ordersQrHint}
        </span>
      </div>

      <section className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
            <p className="text-sm text-slate-500">{t.ordersLoading || "Đang tải danh sách đơn hàng..."}</p>
          </div>
        ) : orders.length > 0 ? (
          orders.map((order) => {
            const product = PRODUCTS.find((p) => p.name === order.productName);
            const image = order.imageUrl || product?.imageUrl;
            const navigationId = order._id || order.id;
            return (
              <div key={order.id} className="space-y-2">
                <OrderCard
                  order={order}
                  imageUrl={image}
                  onClick={() =>
                    navigate(`/orders/${encodeURIComponent(navigationId)}`)
                  }
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/orders/${encodeURIComponent(navigationId)}`)
                    }
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-teal-600 hover:bg-amber-50 hover:text-amber-500 dark:hover:bg-amber-500/10 dark:hover:text-amber-400 transition-colors"
                  >
                    {t.ordersViewDetail}
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 text-slate-400 font-medium">
            {t.ordersNoOrders || "Bạn chưa có đơn hàng nào."}
          </div>
        )}
      </section>
    </div>
  );
}
