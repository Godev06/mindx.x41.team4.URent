import { Clock, Calendar, ArrowRight } from "lucide-react";
import type { Order } from "../../shared/types";
import { useAuth } from "../../auth/hooks/useAuth";
import { useI18n } from "../../shared/context/LanguageContext";
import { useTheme } from "../../settings/hooks/useTheme";

interface ExtendedOrder extends Order {
  rawStartDate?: string;
  rawEndDate?: string;
  image?: string;
}

interface OrderCardProps {
  order: ExtendedOrder;
  imageUrl?: string;
  onClick?: () => void;
}

export function OrderCard({ order, imageUrl, onClick }: OrderCardProps) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { theme } = useTheme();

  const isShowVnd = lang === "vi";
  const isDbVnd = order.totalPrice > 1000;

  const priceInVnd = isDbVnd ? order.totalPrice : order.totalPrice * 25000;
  const priceInUsd = isDbVnd ? order.totalPrice / 25000 : order.totalPrice;
  const displayPrice = isShowVnd ? priceInVnd : priceInUsd;

  const formatPrice = (value: number) => {
    if (isShowVnd) {
      return value.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      });
    }
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // Determine progress percentage
  const getProgress = () => {
    if (order.status === "delivered") return 100;
    if (order.status === "cancelled") return 0;
    if (order.status === "pending" || order.status === "confirmed") return 0;

    try {
      const start = new Date(order.rawStartDate || order.startDate);
      const end = new Date(order.rawEndDate || order.endDate);
      const today = new Date();

      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 50;
      if (today < start) return 0;
      if (today > end) return 100;

      const totalDuration = end.getTime() - start.getTime();
      if (totalDuration <= 0) return 100;

      const elapsed = today.getTime() - start.getTime();
      return Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
    } catch {
      return 50;
    }
  };

  const progressValue = getProgress();

  // Status mapping
  const statusConfig = {
    pending: {
      bg: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/20",
      label: t.orderCardPending || "Chờ xử lý",
      glow: "group-hover:border-amber-400/40",
      barBg: "bg-amber-500",
    },
    confirmed: {
      bg: "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/20",
      label: t.orderCardConfirmed || "Đã duyệt",
      glow: "group-hover:border-sky-400/40",
      barBg: "bg-sky-500",
    },
    shipped: {
      bg: "bg-teal-500/10 text-teal-600 border-teal-500/20 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-500/20",
      label: t.orderCardShipping || "Đang thuê",
      glow: "group-hover:border-teal-400/40",
      barBg: "bg-teal-500",
    },
    delivered: {
      bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20",
      label: t.orderCardDelivered || "Hoàn thành",
      glow: "group-hover:border-emerald-400/40",
      barBg: "bg-emerald-500",
    },
    cancelled: {
      bg: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/20",
      label: "Đã hủy",
      glow: "group-hover:border-rose-400/40",
      barBg: "bg-rose-300 dark:bg-rose-800",
    },
  };

  const status = statusConfig[order.status] || statusConfig.pending;

  return (
    <article
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border p-5 shadow-xs transition-all duration-320 hover:shadow-md hover:-translate-y-0.5 ${theme === "dark"
        ? "border-slate-800 bg-slate-900/60 ring-1 ring-white/5"
        : "border-slate-200 bg-white"
        } ${onClick
          ? `cursor-pointer hover:border-slate-350 dark:hover:border-slate-700 ${status.glow}`
          : ""
        }`}
    >
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Left: Product Image Container */}
        <div className="relative h-24 w-24 sm:h-26 sm:w-26 shrink-0 overflow-hidden rounded-2xl bg-linear-to-br from-slate-100 dark:from-slate-800 to-slate-50 dark:to-slate-750 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center shadow-inner">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={order.productName}
              className="object-cover w-full h-full transform transition-transform duration-500 group-hover:scale-108"
            />
          ) : (
            <span className="text-4xl transform transition-transform duration-500 group-hover:scale-110">{order.image || "🛒"}</span>
          )}

          {/* Subtle category or tag highlight */}
          <div className="absolute top-1 left-1 flex items-center">
            {user && (
              <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase ${String(order.ownerId) === String(user.id)
                ? 'bg-teal-500 text-white shadow-xs'
                : String(order.renterId) === String(user.id)
                  ? 'bg-purple-500 text-white shadow-xs'
                  : 'bg-slate-500 text-white shadow-xs'
                }`}>
                {String(order.ownerId) === String(user.id) ? 'CHO THUÊ' : 'THUÊ'}
              </span>
            )}
          </div>
        </div>

        {/* Right: Order details */}
        <div className="min-w-0 flex-1 flex flex-col justify-between space-y-3">
          {/* Header Row */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
                {order.productName}
              </h3>

              <span className="text-base font-black tracking-tight text-slate-900 dark:text-slate-100">
                {formatPrice(displayPrice)}
              </span>
            </div>

            {/* Metadata Info Row */}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span>
                {t.orderCardCode || "Mã đơn:"}{" "}
                <code className="font-bold text-slate-700 dark:text-slate-300">
                  {order.id}
                </code>
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
              <span className="flex items-center gap-1">
                <Calendar size={12} className="text-slate-400" />
                {order.startDate}
                <ArrowRight size={10} className="text-slate-300" />
                {order.endDate}
              </span>
            </div>
          </div>

          {/* Center/Bottom: Dynamic Progress Tracker */}
          {order.status !== "cancelled" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {order.status === "pending" || order.status === "confirmed"
                    ? "Chờ nhận thiết bị"
                    : order.status === "shipped"
                      ? "Đang sử dụng thiết bị"
                      : "Đã hoàn thành"}
                </span>
                <span>{progressValue}%</span>
              </div>
              <div className="relative w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  style={{ width: `${progressValue}%` }}
                  className={`h-full rounded-full transition-all duration-500 ease-out ${status.barBg} ${order.status === "shipped" ? "animate-pulse" : ""
                    }`}
                />
              </div>
            </div>
          )}

          {/* Footer Info Row */}
          <div className="flex items-center justify-between pt-1">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider uppercase ${status.bg}`}
            >
              {status.label}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
