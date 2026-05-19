import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircle,
  PackageCheck,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ORDERS } from "../../dataset/orders";
import { PRODUCTS } from "../../dataset/products";
import { useI18n } from "../../shared/context/LanguageContext";

export function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const decodedOrderId = orderId ? decodeURIComponent(orderId) : "";

  const order = useMemo(
    () => ORDERS.find((item) => item.id === decodedOrderId) ?? ORDERS[0],
    [decodedOrderId],
  );

  const product = useMemo(
    () => PRODUCTS.find((item) => item.id === order.productId) ?? PRODUCTS[0],
    [order.productId],
  );

  return (
    <div className="space-y-5 pb-10">
      <button
        type="button"
        onClick={() => navigate("/orders")}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <ArrowLeft size={16} />
        {t.orderDetailBack}
      </button>

      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/4 sm:p-6 dark:border-slate-700/80 dark:bg-slate-900/70 dark:ring-white/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t.orderDetailTitle}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t.orderDetailSubtitle}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t.orderDetailStatusNow}
            </p>
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold tracking-tight text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              {t.orderDetailStatusBadge}
            </span>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/4 dark:border-slate-700/80 dark:bg-slate-900/70 dark:ring-white/10">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-white">
              <PackageCheck size={16} />
            </div>
            <p className="text-[11px] font-semibold text-teal-600">
              {t.orderDetailMeetup}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {t.orderDetailMeetupTime}
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white">
              <QrCode size={16} />
            </div>
            <p className="text-[11px] font-semibold text-amber-600">
              {t.orderDetailReceived}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {t.orderDetailVerifyingQr}
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
              <Clock3 size={16} />
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-300">
              {t.orderDetailReturning}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {t.orderDetailNotReached}
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
              <CheckCircle2 size={16} />
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-300">
              {t.orderDetailCompleted}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {t.orderDetailNotConfirmed}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/4 xl:col-span-8 dark:border-slate-700/80 dark:bg-slate-900/70 dark:ring-white/10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t.orderDetailHandoverConfirm}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t.orderDetailHandoverDesc}
          </p>
          <div className="mt-4 inline-flex rounded-full bg-amber-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
            {t.orderDetailQrBadge}
          </div>

          <div className="mt-4 flex items-center justify-center">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
              <div className="flex h-44 w-44 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/80">
                <QrCode
                  size={96}
                  className="text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Clock3 size={14} />
            {t.orderDetailQrRefresh}
          </div>
        </article>

        <aside className="space-y-4 xl:col-span-4">
          <div className="rounded-2xl bg-linear-to-br from-teal-600 to-teal-700 p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {t.orderDetailProtectTitle}
              </h3>
              <ShieldCheck size={16} />
            </div>
            <ul className="mt-3 space-y-2 text-xs text-teal-100">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5" />
                {t.orderDetailProtectLine1}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5" />
                {t.orderDetailProtectLine2}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5" />
                {t.orderDetailProtectLine3}
              </li>
            </ul>
            <button className="mt-4 w-full rounded-lg bg-white px-3 py-2 text-xs font-semibold text-teal-600 hover:text-amber-500">
              {t.orderDetailProtectBtn}
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/4 dark:border-slate-700/80 dark:bg-slate-900/70 dark:ring-white/10">
            <div className="border-b border-slate-200/80 bg-linear-to-r from-slate-50 to-teal-50/70 px-5 py-4 dark:border-slate-700/80 dark:from-slate-900 dark:to-teal-500/10">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t.orderDetailSupportTitle}
                </h3>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {t.orderDetailSupportOnline}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {t.orderDetailAvgResponse}
              </p>
            </div>

            <div className="p-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="text-[11px] leading-5 text-slate-600 dark:text-slate-300">
                  {t.orderDetailSupportDesc}
                </p>
              </div>

              <div className="mt-4 space-y-2.5">
                <button
                  type="button"
                  onClick={() => navigate("/messages")}
                  className="group flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left transition hover:border-teal-300 hover:bg-teal-50/40 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-teal-500/40 dark:hover:bg-slate-800"
                >
                  <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                    <MessageCircle size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {t.orderDetailChatExpert}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {t.orderDetailChatExpertDesc}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/messages")}
                  className="group flex w-full items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-3 text-left transition hover:bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10"
                >
                  <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                    <AlertTriangle size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                      {t.orderDetailReportViolation}
                    </p>
                    <p className="mt-0.5 text-[11px] text-rose-700/80 dark:text-rose-200/90">
                      {t.orderDetailReportViolationDesc}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/4 xl:col-span-8 dark:border-slate-700/80 dark:bg-slate-900/70 dark:ring-white/10">
          <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700/80">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xl">
                      {order.image}
                    </div>
                  )}
                </div>
                <div>
                  <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold tracking-tight text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300">
                    {t.orderDetailMarketplace}
                  </span>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {product.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.orderDetailOwner}:{" "}
                    {product.owner?.name || t.orderDetailOwnerFallback}
                  </p>
                </div>
              </div>
              <dl className="mt-4 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <dt>{t.orderDetailRentalDuration}</dt>
                  <dd className="font-medium text-slate-800 dark:text-slate-100">
                    {t.orderDetailRentalDurationValue}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>{t.orderDetailStartDate}</dt>
                  <dd className="font-medium text-slate-800 dark:text-slate-100">
                    {order.startDate}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>{t.orderDetailEndDate}</dt>
                  <dd className="font-medium text-slate-800 dark:text-slate-100">
                    {order.endDate}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t.orderDetailPaymentDetails}
              </h4>
              <dl className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <dt>{t.orderDetailRentPerDay}</dt>
                  <dd>${product.price}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>{t.orderDetailServiceFee}</dt>
                  <dd>${Math.round(order.totalPrice * 0.1)}</dd>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <dt>{t.orderDetailDeposit}</dt>
                  <dd>${Math.round(order.totalPrice * 2)}</dd>
                </div>
              </dl>
              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {t.orderDetailTotal}
                </span>
                <span className="text-xl font-bold text-teal-600">
                  ${order.totalPrice}
                </span>
              </div>
            </div>
          </div>
        </article>

        <aside className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm ring-1 ring-slate-900/4 xl:col-span-4 dark:border-slate-700/80 dark:bg-slate-900/70 dark:ring-white/10">
          <div className="flex h-full min-h-55 flex-col overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800/80">
            <div className="flex flex-1 items-center justify-center">
              <MapPin
                size={84}
                className="text-slate-400 dark:text-slate-500"
              />
            </div>
            <div className="border-t border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900/80">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t.orderDetailPickupLocation}
              </p>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {t.orderDetailPickupAddress}
              </p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
