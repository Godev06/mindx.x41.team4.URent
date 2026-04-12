import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ORDERS } from "../../shared/data";
import { Badge } from "../../shared/components/Badge";
import { OrderCard } from "../components/OrderCard";
import { useTheme } from "../../settings/hooks/useTheme";
import { useI18n } from "../../shared/context/LanguageContext";

export function OrdersPage() {
  const { theme } = useTheme();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const activeOrders = ORDERS.filter(
    (item) =>
      item.status === "pending" ||
      item.status === "confirmed" ||
      item.status === "shipped",
  ).length;
  const completedOrders = ORDERS.filter(
    (item) => item.status === "delivered",
  ).length;
  const t =
    lang === "vi"
      ? {
          title: "Đơn hàng",
          desc: "Theo dõi thuê và trả thiết bị của bạn.",
          active: "Đơn đang xử lý",
          done: "Đơn hoàn tất",
          recent: "Danh sách đơn gần đây",
          qrHint: "Chọn đơn để xử lý QR",
          viewDetail: "Xem chi tiết đơn",
        }
      : {
          title: "Orders",
          desc: "Track your device rental and return workflow.",
          active: "Processing orders",
          done: "Completed orders",
          recent: "Recent orders",
          qrHint: "Select an order to process QR",
          viewDetail: "View order details",
        };

  return (
    <div className="space-y-8">
      <div>
        <h1
          className={`text-2xl font-bold tracking-tight ${
            theme === "dark" ? "text-slate-100" : "text-slate-900"
          }`}
        >
          {t.title}
        </h1>
        <p
          className={`mt-1 text-sm ${
            theme === "dark" ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {t.desc}
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
            {t.active}
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
            {t.done}
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
        <h2 className="text-sm font-semibold text-slate-900">{t.recent}</h2>
        <Badge variant="yellow">{t.qrHint}</Badge>
      </div>

      <section className="space-y-4">
        {ORDERS.map((order) => (
          <div key={order.id} className="space-y-2">
            <OrderCard
              order={order}
              onClick={() =>
                navigate(`/orders/${encodeURIComponent(order.id)}`)
              }
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  navigate(`/orders/${encodeURIComponent(order.id)}`)
                }
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-teal-600 hover:bg-amber-50 hover:text-amber-500"
              >
                {t.viewDetail}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
