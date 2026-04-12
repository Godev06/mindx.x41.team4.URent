import { useState } from "react";
import { Calendar, Minus, Plus, ShieldCheck } from "lucide-react";
import { Badge } from "../../shared/components/Badge";
import type { Product } from "../../shared/types";
import { useI18n } from "../../shared/context/LanguageContext";

interface ProductBookingCardProps {
  product: Product;
}

export function ProductBookingCard({ product }: ProductBookingCardProps) {
  const [days, setDays] = useState(1);
  const { lang } = useI18n();
  const t =
    lang === "vi"
      ? {
          rentPrice: "Giá thuê",
          dayUnit: "/ ngày",
          ready: "Sẵn sàng",
          subtotal: "Tạm tính",
          days: "Số ngày",
          decreaseDays: "Giảm số ngày",
          increaseDays: "Tăng số ngày",
          total: "Tổng cộng",
          rentRequest: "Gửi yêu cầu thuê",
          protectedPayment: "Thanh toán được bảo vệ",
          schedulable: "Có thể đặt lịch giao nhận",
        }
      : {
          rentPrice: "Rental price",
          dayUnit: "/ day",
          ready: "Available",
          subtotal: "Subtotal",
          days: "Days",
          decreaseDays: "Decrease days",
          increaseDays: "Increase days",
          total: "Total",
          rentRequest: "Send rental request",
          protectedPayment: "Protected payment",
          schedulable: "Pickup scheduling available",
        };

  return (
    <div className="sticky top-24 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/4 sm:p-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            {t.rentPrice}
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-bold tabular-nums text-teal-600">
              ${product.price}
            </span>
            <span className="text-sm font-medium text-slate-500">
              {t.dayUnit}
            </span>
          </div>
        </div>
        <Badge variant="green">{t.ready}</Badge>
      </div>

      <div className="mb-6 space-y-4 rounded-xl bg-slate-50/90 p-4 ring-1 ring-slate-200/80">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">{t.subtotal}</span>
          <span className="font-semibold tabular-nums text-slate-900">
            ${product.price * days}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">{t.days}</span>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => setDays((n) => Math.max(1, n - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100"
              aria-label={t.decreaseDays}
            >
              <Minus size={16} strokeWidth={2.5} />
            </button>
            <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
              {days}
            </span>
            <button
              type="button"
              onClick={() => setDays((n) => n + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100"
              aria-label={t.increaseDays}
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-4 text-sm">
          <span className="font-semibold text-slate-900">{t.total}</span>
          <span className="text-xl font-bold tabular-nums text-teal-600">
            ${product.price * days + 2.5}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="w-full rounded-xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/15 transition hover:bg-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
      >
        {t.rentRequest}
      </button>

      <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <ShieldCheck size={14} className="text-teal-600" strokeWidth={2} />
        {t.protectedPayment}
      </div>
      <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <Calendar size={14} className="text-slate-400" strokeWidth={2} />
        {t.schedulable}
      </div>
    </div>
  );
}
