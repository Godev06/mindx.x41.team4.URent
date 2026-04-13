import { Clock } from "lucide-react";
import type { Order } from "../../shared/types";
import { useI18n } from "../../shared/context/LanguageContext";

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
}

export function OrderCard({ order, onClick }: OrderCardProps) {
  const { lang } = useI18n();
  const statusVariant =
    order.status === "delivered"
      ? "green"
      : order.status === "shipped"
        ? "blue"
        : order.status === "confirmed"
          ? "yellow"
          : "gray";
  const statusClass =
    statusVariant === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
      : statusVariant === "blue"
        ? "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300"
        : statusVariant === "yellow"
          ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
          : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600/50 dark:bg-slate-700/30 dark:text-slate-300";

  return (
    <article
      onClick={onClick}
      className={`flex gap-5 rounded-2xl border border-slate-200/90 dark:border-slate-700/90 bg-white dark:bg-slate-800 p-5 shadow-sm ring-1 ring-slate-900/4 dark:ring-white/4 transition-shadow hover:shadow-md ${onClick ? "cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-600" : ""}`}
    >
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-slate-100 dark:from-slate-700 to-slate-50 dark:to-slate-600 ring-1 ring-slate-200/80 dark:ring-slate-600/80">
        <span className="text-4xl">{order.image}</span>
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {order.productName}
          </h3>
          <span className="text-base font-bold tabular-nums text-slate-900 dark:text-slate-100">
            ${order.totalPrice}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {lang === "vi" ? "Mã đơn:" : "Order code:"}{" "}
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {order.id}
          </span>
        </p>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <Clock
            size={14}
            className="text-slate-400 dark:text-slate-500"
            strokeWidth={2}
          />
          {lang === "vi" ? "Trả dự kiến" : "Expected return"}: {order.endDate}
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-tight ${statusClass}`}
        >
          {lang === "vi"
            ? order.status === "delivered"
              ? "Đã giao"
              : order.status === "shipped"
                ? "Đang giao"
                : order.status === "confirmed"
                  ? "Đã xác nhận"
                  : "Chờ xử lý"
            : order.status === "delivered"
              ? "Delivered"
              : order.status === "shipped"
                ? "Shipping"
                : order.status === "confirmed"
                  ? "Confirmed"
                  : "Pending"}
        </span>
      </div>
    </article>
  );
}
