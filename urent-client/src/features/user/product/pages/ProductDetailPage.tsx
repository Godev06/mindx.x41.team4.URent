import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import { PRODUCTS } from "../../dataset/products";
import type { Product } from "../../shared/types";
import { ProductBookingCard } from "../components/ProductBookingCard";
import { ProductSpecRow } from "../components/ProductSpecRow";
import { ProductReviews } from "../components/ProductReviews";
import { useI18n } from "../../shared/context/LanguageContext";
import { productService } from "../services/productService";

interface ProductDetailPageProps {
  productId: string | number | null;
  onBack: () => void;
}

const DEFAULT_DESCRIPTION = [
  "Đầy đủ phụ kiện theo mô tả",
  "Hỗ trợ giao nhận tại địa điểm thỏa thuận",
];

export function ProductDetailPage({
  productId,
  onBack,
}: ProductDetailPageProps) {
  const { t } = useI18n();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadProductDetail() {
      if (!productId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Only try to call BE API if the productId looks like a MongoDB ObjectId (string of length 24 hex characters)
        // or is a non-numeric string.
        const isObjectId = typeof productId === "string" && productId.length === 24 && /^[0-9a-fA-F]+$/.test(productId);
        
        if (isObjectId) {
          const fetched = await productService.getProductById(productId);
          if (active) {
            setProduct(fetched);
          }
        } else {
          // It's a mock numeric ID or string, find in static dataset
          const found = PRODUCTS.find((item) => String(item.id) === String(productId));
          if (active) {
            setProduct(found ?? null);
          }
        }
      } catch (err: any) {
        console.error("Failed to load product detail from BE API, falling back to mock:", err);
        const found = PRODUCTS.find((item) => String(item.id) === String(productId));
        if (active) {
          setProduct(found ?? null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadProductDetail();
    return () => {
      active = false;
    };
  }, [productId]);

  const description = product?.description ?? DEFAULT_DESCRIPTION;

  if (isLoading) {
    return (
      <div className="pb-12 animate-pulse space-y-8">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur-sm transition dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          {t.productDetailBack}
        </button>
        <div className="h-64 sm:h-80 md:h-96 w-full rounded-3xl bg-slate-200 dark:bg-slate-700" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-700" />
              ))}
            </div>
            <div className="h-48 rounded-3xl bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="lg:col-span-4">
            <div className="h-96 rounded-3xl bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center space-y-4">
        <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">
          Không tìm thấy sản phẩm này
        </p>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="pb-12">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-teal-400/40 dark:hover:bg-teal-500/10 dark:hover:text-teal-300"
      >
        <ArrowLeft size={16} strokeWidth={2.5} />
        {t.productDetailBack}
      </button>

      {/* Hero image */}
      {(product.imageUrl || product.image) && (
        <div className="relative mb-8 h-64 w-full overflow-hidden rounded-3xl sm:h-80 md:h-96">
          <img
            src={product.imageUrl || product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-slate-900/10 to-transparent" />
          {/* Floating category badge */}
          <span className="absolute top-4 left-4 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-md">
            {product.category}
          </span>
          {/* Floating availability badge */}
          <span className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {t.bookingReady}
          </span>
          {/* Bottom info on hero */}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow sm:text-3xl md:text-4xl">
              {product.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <div className="inline-flex items-center gap-1 font-semibold text-amber-300">
                <Star size={14} fill="currentColor" />
                <span className="tabular-nums">{product.rating ?? 4.9}</span>
                <span className="font-normal text-white/70">
                  {t.productDetailReviewUnit}
                </span>
              </div>
              <span className="h-3 w-px bg-white/30" aria-hidden />
              <div className="inline-flex items-center gap-1 text-white/80">
                <MapPin size={13} strokeWidth={2} />
                {t.productDetailLocation}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-8">
          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: t.productDetailAssurance,
                value: t.productDetailAssuranceValue,
                icon: ShieldCheck,
                color: "text-teal-600 dark:text-teal-400",
                bg: "bg-teal-50 dark:bg-teal-500/10",
              },
              {
                label: t.productDetailSupport,
                value: t.productDetailSupportValue,
                icon: Zap,
                color: "text-amber-600 dark:text-amber-400",
                bg: "bg-amber-50 dark:bg-amber-500/10",
              },
              {
                label: t.productDetailResponse,
                value: t.productDetailResponseValue,
                icon: MessageCircle,
                color: "text-violet-600 dark:text-violet-400",
                bg: "bg-violet-50 dark:bg-violet-500/10",
              },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-3 text-center shadow-sm ring-1 ring-slate-900/4 dark:border-white/8 dark:bg-white/4 dark:ring-white/4"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}
                >
                  <Icon size={16} strokeWidth={2} className={color} />
                </div>
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  {label}
                </p>
                <p className="text-xs font-bold leading-tight text-slate-800 dark:text-slate-100">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Main info card */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/4 dark:border-white/8 dark:bg-[#101a2a] dark:ring-white/4">
            {/* Header gradient strip */}
            <div className="h-1.5 w-full bg-linear-to-r from-teal-400 via-cyan-400 to-teal-500" />

            <div className="p-6 sm:p-8">
              {/* Title (shown if no imageUrl) */}
              {!product.imageUrl && !product.image && (
                <h1 className="mb-4 text-balance text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  {product.name}
                </h1>
              )}

              {/* Summary */}
              <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                {product.summary ?? t.productDetailDefaultDescription}
              </p>

              {/* Specs */}
              <div className="mt-8">
                <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                  Thông số kỹ thuật
                </h2>
                <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {description.map((spec) => (
                    <ProductSpecRow key={spec} text={spec} />
                  ))}
                </ul>
              </div>

              {/* Policy pills */}
              <div className="mt-8 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1.5 text-xs font-semibold text-teal-700 dark:border-teal-500/25 dark:bg-teal-500/10 dark:text-teal-300">
                  <ShieldCheck size={13} strokeWidth={2.2} />
                  {t.productDetailRenterPolicy}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-xs font-semibold text-orange-700 dark:border-orange-500/25 dark:bg-orange-500/10 dark:text-orange-300">
                  <Truck size={13} strokeWidth={2.2} />
                  {t.productDetailFlexibleDelivery}
                </span>
              </div>
            </div>
          </div>

          {/* Owner card */}
          {product.owner && (
            <div className="flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/4 dark:border-white/8 dark:bg-[#101a2a] dark:ring-white/4">
              <img
                src={product.owner.avatar}
                alt={product.owner.name}
                className="h-14 w-14 rounded-2xl object-cover ring-2 ring-slate-200 dark:ring-white/10"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Chủ sở hữu
                </p>
                <p className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
                  {product.owner.name}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                    <Star size={11} fill="currentColor" />
                    {product.owner.rating.toFixed(1)}
                  </span>
                  <span className="h-3 w-px bg-slate-200 dark:bg-white/10" />
                  <span className="inline-flex items-center gap-1">
                    <Award size={11} className="text-slate-400" />
                    {product.owner.trips} chuyến
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-500 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600 dark:border-white/10 dark:bg-white/5 dark:hover:border-teal-400/30 dark:hover:bg-teal-500/10 dark:hover:text-teal-400"
              >
                <MessageCircle size={18} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>

        {/* Booking sidebar */}
        <div className="lg:col-span-4">
          <ProductBookingCard product={product} />
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-8">
        <ProductReviews
          productId={product._id || product.id || ""}
          rating={product.rating}
          reviews={product.reviewsCount ?? product.reviews}
        />
      </div>
    </div>
  );
}
