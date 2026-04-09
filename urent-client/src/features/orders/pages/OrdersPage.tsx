import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ORDERS } from "../../shared/data";
import { Badge } from "../../shared/components/Badge";
import { OrderCard } from "../components/OrderCard";

export function OrdersPage() {
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Đơn hàng
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Theo dõi thuê và trả thiết bị của bạn.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04]">
          <p className="text-xs font-medium text-slate-500">Đơn đang xử lý</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {activeOrders}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04]">
          <p className="text-xs font-medium text-slate-500">Đơn hoàn tất</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {completedOrders}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04]">
          <p className="text-xs font-medium text-slate-500">Tỷ lệ đúng hạn</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">96%</p>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">
          Danh sách đơn gần đây
        </h2>
        <Badge variant="yellow">Chọn đơn để xử lý QR</Badge>
      </div>

      <section className="space-y-4">
        {ORDERS.map((order) => (
          <div key={order.id} className="space-y-2">
            <OrderCard
              order={order}
              onClick={() => navigate(`/orders/${order.id}`)}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate(`/orders/${order.id}`)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-teal-600 hover:bg-amber-50 hover:text-amber-500"
              >
                Xem chi tiết đơn
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
