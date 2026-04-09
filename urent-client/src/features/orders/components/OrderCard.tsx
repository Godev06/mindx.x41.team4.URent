import { Clock } from "lucide-react";
import { Badge } from "../../shared/components/Badge";
import type { Order } from "../../shared/types";

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
}

export function OrderCard({ order, onClick }: OrderCardProps) {
  const statusVariant =
    order.status === "delivered"
      ? "green"
      : order.status === "shipped"
        ? "blue"
        : order.status === "confirmed"
          ? "yellow"
          : "gray";

  return (
    <article
      onClick={onClick}
      className={`flex gap-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.04] transition-shadow hover:shadow-md ${
        onClick ? "cursor-pointer hover:border-indigo-200" : ""
      }`}
    >
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-200/80">
        <span className="text-4xl">{order.image}</span>
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900">
            {order.productName}
          </h3>
          <span className="text-base font-bold tabular-nums text-slate-900">
            ${order.totalPrice}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Mã đơn: <span className="font-medium text-slate-700">{order.id}</span>
        </p>
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Clock size={14} className="text-slate-400" strokeWidth={2} />
          Trả dự kiến: {order.endDate}
        </div>
        <Badge variant={statusVariant}>
          {order.status === "delivered"
            ? "Đã giao"
            : order.status === "shipped"
              ? "Đang giao"
              : order.status === "confirmed"
                ? "Đã xác nhận"
                : "Chờ xử lý"}
        </Badge>
      </div>
    </article>
  );
}
