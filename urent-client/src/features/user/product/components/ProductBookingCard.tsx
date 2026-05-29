import { useState } from "react";
import {
  Clock,
  LogIn,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../shared/types";
import { useI18n } from "../../shared/context/LanguageContext";
import { useAuth } from "../../auth/hooks/useAuth";
import { APP_ROUTES } from "../../auth/constants";
import { apiClient } from "../../../../lib/api/apiClient";
import { useToast } from "../../shared/hooks/useToast";

interface ProductBookingCardProps {
  product: Product;
}

export function ProductBookingCard({ product }: ProductBookingCardProps) {
  const [days, setDays] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t, lang } = useI18n();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isDbVnd = product.price > 1000;
  const isShowVnd = lang === "vi";

  // Convert prices dynamically depending on language context:
  const priceInVnd = isDbVnd ? product.price : product.price * 25000;
  const priceInUsd = isDbVnd ? product.price / 25000 : product.price;

  const displayPrice = isShowVnd ? priceInVnd : priceInUsd;
  const serviceFee = isShowVnd ? 10000 : 2.5;
  const total = displayPrice * days + serviceFee;

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

  const handleRentClick = async () => {
    if (!isAuthenticated) {
      setShowModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + days);

      const response = await apiClient.post("/api/v1/orders", {
        productId: String(product._id || product.id),
        productName: product.name,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        totalPrice: priceInVnd * days,
      });

      showToast({
        title: lang === "vi" ? "Gửi yêu cầu thuê thành công!" : "Rental request submitted!",
        description: lang === "vi"
          ? `Đơn hàng ${response.data.data.orderCode} đã được tạo thành công.`
          : `Order ${response.data.data.orderCode} has been successfully created.`,
        variant: "success",
      });

      setTimeout(() => {
        navigate("/orders");
      }, 1000);
    } catch (err: any) {
      console.error("Failed to submit rental request:", err);
      showToast({
        title: lang === "vi" ? "Lỗi gửi yêu cầu" : "Request failed",
        description:
          err.response?.data?.error?.message ||
          err.message ||
          (lang === "vi" ? "Đã có lỗi xảy ra." : "An error occurred."),
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmLogin = () => {
    setShowModal(false);
    setIsLoading(true);
    setTimeout(() => {
      navigate(APP_ROUTES.login, {
        state: { from: window.location.pathname },
      });
    }, 800);
  };

  return (
    <>
      {/* Login confirm modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-modal-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          {/* Card */}
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_32px_80px_-20px_rgba(15,23,42,0.5)] dark:border-white/10 dark:bg-[#0f1929]">
            <div className="h-1.5 w-full bg-linear-to-r from-teal-400 via-cyan-400 to-teal-500" />
            <div className="p-6">
              {/* Close */}
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/8 dark:hover:text-white"
                aria-label="Close"
              >
                <X size={16} strokeWidth={2.5} />
              </button>

              {/* Icon */}
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-teal-400 to-cyan-500 shadow-lg shadow-teal-500/30">
                <LogIn size={24} strokeWidth={2} className="text-white" />
              </div>

              <h2
                id="booking-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                {t.bookingLoginModalTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {t.bookingLoginModalDesc}
              </p>

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleConfirmLogin}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-teal-500 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-500/25 transition hover:from-teal-600 hover:to-cyan-600 active:scale-[0.98]"
                >
                  <LogIn size={16} strokeWidth={2.5} />
                  {t.bookingLoginModalConfirm}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/8"
                >
                  {t.bookingLoginModalCancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Card Interface */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/8 ring-1 ring-slate-900/4 md:sticky md:top-24 dark:border-white/8 dark:bg-[#101a2a] dark:ring-white/4">
        {/* Gradient top strip */}
        <div className="h-1.5 w-full bg-linear-to-r from-teal-400 via-cyan-400 to-teal-500" />

        <div className="p-5 sm:p-6">
          {/* Price header */}
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                {t.bookingRentPrice}
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {formatPrice(displayPrice)}
                </span>
                <span className="mb-0.5 text-sm font-medium text-slate-400 dark:text-slate-500">
                  {t.bookingDayUnit}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t.bookingReady}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                <Zap size={10} />
                Instant confirm
              </span>
            </div>
          </div>

          {/* Day picker */}
          <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t.bookingDays}
              </span>
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm dark:border-white/10 dark:bg-white/6">
                <button
                  type="button"
                  onClick={() => setDays((n) => Math.max(1, n - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white"
                  aria-label={t.bookingDecreaseDays}
                >
                  <Minus size={15} strokeWidth={2.5} />
                </button>
                <span className="min-w-8 text-center text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                  {days}
                </span>
                <button
                  type="button"
                  onClick={() => setDays((n) => n + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white"
                  aria-label={t.bookingIncreaseDays}
                >
                  <Plus size={15} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="space-y-2.5 border-t border-slate-200/80 pt-3 dark:border-white/8">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  {formatPrice(displayPrice)} × {days} {t.bookingDayUnit}
                </span>
                <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                  {formatPrice(displayPrice * days)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  {t.bookingSubtotal}
                </span>
                <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                  {formatPrice(serviceFee)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2.5 dark:border-white/10">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.bookingTotal}
                </span>
                <span className="text-2xl font-bold tabular-nums text-teal-600 dark:text-teal-400">
                  {formatPrice(total)}
                </span>
              </div>
            </div>
          </div>

          {/* CTA button */}
          <button
            type="button"
            onClick={handleRentClick}
            disabled={isLoading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-teal-500 to-cyan-500 py-4 text-sm font-bold tracking-wide text-white shadow-lg shadow-teal-500/25 transition hover:from-teal-600 hover:to-cyan-600 hover:shadow-teal-500/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
                <span>Đang chuyển hướng...</span>
              </>
            ) : (
              t.bookingRentRequest
            )}
          </button>

          {/* Trust footer */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <ShieldCheck
                size={13}
                className="text-teal-500"
                strokeWidth={2}
              />
              {t.bookingProtectedPayment}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <Clock size={12} strokeWidth={2} />
              {t.bookingSchedulable}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}