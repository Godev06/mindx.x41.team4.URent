import { Clock } from "lucide-react";
import { Badge } from "../../shared/components/Badge";
import type { Product } from "../../shared/types";

interface OrderCardProps {
  order: Product;
  orderCode?: string;
  onClick?: () => void;
}

export function OrderCard({ order, orderCode = "#URBT-85219", onClick }: OrderCardProps) {
  return (
    <article
      onClick={onClick}
      className={`flex gap-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.04] transition-shadow hover:shadow-md ${
        onClick ? "cursor-pointer hover:border-indigo-200" : ""
      }`}
    >
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-200/80">
        {order.imageUrl ? (
          <img src={order.imageUrl} alt={order.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="text-4xl">{order.image}</span>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900">{order.name}</h3>
          <span className="text-base font-bold tabular-nums text-slate-900">${order.price * 2}</span>
        </div>
        <p className="text-xs text-slate-500">
          Mã đơn: <span className="font-medium text-slate-700">{orderCode}</span>
        </p>
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Clock size={14} className="text-slate-400" strokeWidth={2} />
          Trả dự kiến: 24/10/2024
        </div>
        <Badge variant={order.status === "Active" ? "blue" : "green"}>{order.status}</Badge>
      </div>
    </article>
  );
}
