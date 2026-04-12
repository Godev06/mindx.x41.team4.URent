import { useMemo } from "react";
import { ArrowLeft, MapPin, ShieldCheck, Star, Truck } from "lucide-react";
import { PRODUCTS } from "../../shared/data";
import type { Product } from "../../shared/types";
import { ProductBookingCard } from "../components/ProductBookingCard";
import { ProductSpecRow } from "../components/ProductSpecRow";
import { useI18n } from "../../shared/context/LanguageContext";

interface ProductDetailPageProps {
  productId: number | null;
  onBack: () => void;
}

const DEFAULT_SPECS = [
  "Đầy đủ phụ kiện theo mô tả",
  "Hỗ trợ giao nhận tại địa điểm thỏa thuận",
];

export function ProductDetailPage({
  productId,
  onBack,
}: ProductDetailPageProps) {
  const { lang } = useI18n();
  const product: Product = useMemo(
    () => PRODUCTS.find((item) => item.id === productId) ?? PRODUCTS[0],
    [productId],
  );

  const specs = product.specs ?? DEFAULT_SPECS;
  const t =
    lang === "vi"
      ? {
          back: "Quay lại",
          assurance: "Bảo đảm thiết bị",
          assuranceValue: "Đã kiểm định trước giao",
          support: "Hỗ trợ",
          supportValue: "24/7 qua chat và hotline",
          response: "Phản hồi chủ thiết bị",
          responseValue: "Dưới 10 phút",
          reviewUnit: "đánh giá",
          location: "Thủ Đức, TP.HCM",
          defaultDescription: "Thông tin sản phẩm đang được cập nhật.",
          renterPolicy: "Chính sách bảo vệ người thuê",
          flexibleDelivery: "Hỗ trợ giao nhận linh hoạt",
        }
      : {
          back: "Back",
          assurance: "Device assurance",
          assuranceValue: "Inspected before delivery",
          support: "Support",
          supportValue: "24/7 via chat and hotline",
          response: "Owner response time",
          responseValue: "Under 10 minutes",
          reviewUnit: "reviews",
          location: "Thu Duc, Ho Chi Minh City",
          defaultDescription: "Product information is being updated.",
          renterPolicy: "Renter protection policy",
          flexibleDelivery: "Flexible delivery support",
        };

  return (
    <div className="pb-12">
      <button
        type="button"
        onClick={onBack}
        className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
      >
        <ArrowLeft size={18} strokeWidth={2} />
        {t.back}
      </button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04]">
              <p className="text-xs font-medium text-slate-500">
                {t.assurance}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {t.assuranceValue}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04]">
              <p className="text-xs font-medium text-slate-500">{t.support}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {t.supportValue}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04]">
              <p className="text-xs font-medium text-slate-500">{t.response}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {t.responseValue}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.04] sm:p-8">
            <h1 className="text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {product.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <div className="inline-flex items-center gap-1.5 font-semibold text-orange-500">
                <Star
                  size={17}
                  fill="currentColor"
                  className="text-orange-400"
                />
                <span className="tabular-nums text-slate-900">
                  {product.rating ?? 4.9}
                </span>
                <span className="font-normal text-slate-400">
                  {t.reviewUnit}
                </span>
              </div>
              <span
                className="hidden h-4 w-px bg-slate-200 sm:block"
                aria-hidden
              />
              <div className="inline-flex items-center gap-1.5 text-slate-600">
                <MapPin size={16} className="text-slate-400" strokeWidth={2} />
                {t.location}
              </div>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
              {product.description ?? t.defaultDescription}
            </p>
            <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {specs.map((spec) => (
                <ProductSpecRow key={spec} text={spec} />
              ))}
            </ul>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <ShieldCheck size={16} className="text-teal-700" />
                {t.renterPolicy}
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <Truck size={16} className="text-orange-500" />
                {t.flexibleDelivery}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <ProductBookingCard product={product} />
        </div>
      </div>
    </div>
  );
}
