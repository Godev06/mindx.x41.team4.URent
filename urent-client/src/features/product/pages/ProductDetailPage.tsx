import { useMemo } from "react";
import { ArrowLeft, MapPin, ShieldCheck, Star, Truck } from "lucide-react";
import { PRODUCTS } from "../../shared/data";
import type { Product } from "../../shared/types";
import { ProductBookingCard } from "../components/ProductBookingCard";
import { ProductSpecRow } from "../components/ProductSpecRow";

interface ProductDetailPageProps {
  productId: number | null;
  onBack: () => void;
}

const DEFAULT_SPECS = ["Đầy đủ phụ kiện theo mô tả", "Hỗ trợ giao nhận tại địa điểm thỏa thuận"];

export function ProductDetailPage({ productId, onBack }: ProductDetailPageProps) {
  const product: Product = useMemo(
    () => PRODUCTS.find((item) => item.id === productId) ?? PRODUCTS[0],
    [productId],
  );

  const specs = product.specs ?? DEFAULT_SPECS;

  return (
    <div className="pb-12">
      <button
        type="button"
        onClick={onBack}
        className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
      >
        <ArrowLeft size={18} strokeWidth={2} />
        Quay lại
      </button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04]">
              <p className="text-xs font-medium text-slate-500">Bảo đảm thiết bị</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Đã kiểm định trước giao</p>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04]">
              <p className="text-xs font-medium text-slate-500">Hỗ trợ</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">24/7 qua chat và hotline</p>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04]">
              <p className="text-xs font-medium text-slate-500">Phản hồi chủ thiết bị</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Dưới 10 phút</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.04] sm:p-8">
            <h1 className="text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{product.name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <div className="inline-flex items-center gap-1.5 font-semibold text-orange-500">
                <Star size={17} fill="currentColor" className="text-orange-400" />
                <span className="tabular-nums text-slate-900">{product.rating ?? 4.9}</span>
                <span className="font-normal text-slate-400">đánh giá</span>
              </div>
              <span className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden />
              <div className="inline-flex items-center gap-1.5 text-slate-600">
                <MapPin size={16} className="text-slate-400" strokeWidth={2} />
                Thủ Đức, TP.HCM
              </div>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
              {product.description ?? "Thông tin sản phẩm đang được cập nhật."}
            </p>
            <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {specs.map((spec) => (
                <ProductSpecRow key={spec} text={spec} />
              ))}
            </ul>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <ShieldCheck size={16} className="text-teal-700" />
                Chính sách bảo vệ người thuê
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <Truck size={16} className="text-orange-500" />
                Hỗ trợ giao nhận linh hoạt
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
