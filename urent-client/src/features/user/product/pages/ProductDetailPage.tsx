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
  Maximize2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PRODUCTS } from "../../dataset/products";
import type { Product } from "../../shared/types";
import { ProductBookingCard } from "../components/ProductBookingCard";
import { ProductSpecRow } from "../components/ProductSpecRow";
import { ProductReviews } from "../components/ProductReviews";
import { useI18n } from "../../shared/context/LanguageContext";
import { productService } from "../services/productService";
import { useAuth } from "../../auth/hooks/useAuth";
import { useAuthGate } from "../../auth/context/AuthGateContext";
import { useToast } from "../../shared/hooks/useToast";
import { messageService } from "../../messages/services/messageService";

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
  // Khai báo kiểu mở rộng để nhận diện các trường mới
  const [product, setProduct] = useState<(Product & { locationText?: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { guardedNavigate } = useAuthGate();
  const { showToast } = useToast();
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen]);

  const isOwner = useMemo(() => {
    if (!product) return false;
    const targetOwnerId = product.owner?.id || product.ownerId;
    return String(targetOwnerId) === String(user?.id);
  }, [product, user]);

  const handleContactOwner = async () => {
    if (!product) return;
    const targetOwnerId = product.owner?.id || product.ownerId;
    if (!targetOwnerId) {
      showToast({
        title: "Thông báo",
        description: "Không thể xác định thông tin chủ sở hữu.",
        variant: "error",
      });
      return;
    }

    if (!isAuthenticated) {
      guardedNavigate(`/messages`);
      return;
    }

    if (String(user?.id) === String(targetOwnerId)) {
      showToast({
        title: "Thông báo",
        description: "Bạn không thể tự nhắn tin cho chính mình.",
        variant: "error",
      });
      return;
    }

    try {
      setIsCreatingChat(true);
      const conversation = await messageService.createConversation(String(targetOwnerId));
      navigate(`/messages/${conversation.id}`);
    } catch (err: any) {
      console.error("Failed to create/open conversation:", err);
      showToast({
        title: "Lỗi kết nối",
        description: err.response?.data?.error?.message || err.message || "Không thể mở hộp thoại tin nhắn.",
        variant: "error",
      });
    } finally {
      setIsCreatingChat(false);
    }
  };

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
        
        const isObjectId = typeof productId === "string" && productId.length === 24 && /^[0-9a-fA-F]+$/.test(productId);
        
        if (isObjectId) {
          const fetched = await productService.getProductById(productId);
          if (active) setProduct(fetched);
        } else {
          const found = PRODUCTS.find((item) => String(item.id) === String(productId));
          if (active) setProduct(found ?? null);
        }
      } catch (err: any) {
        console.error("Failed to load product detail from BE API, falling back to mock:", err);
        const found = PRODUCTS.find((item) => String(item.id) === String(productId));
        if (active) setProduct(found ?? null);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadProductDetail();
    return () => { active = false; };
  }, [productId]);

  const description = product?.description ?? DEFAULT_DESCRIPTION;

  if (isLoading) {
    return (
      <div className="pb-12 animate-pulse space-y-8">
        <button type="button" onClick={onBack} className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur-sm transition dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <ArrowLeft size={16} strokeWidth={2.5} />
          {t.productDetailBack}
        </button>
        <div className="h-64 sm:h-80 md:h-96 w-full rounded-3xl bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center space-y-4">
        <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">Không tìm thấy sản phẩm này</p>
        <button type="button" onClick={onBack} className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <button type="button" onClick={onBack} className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
        <ArrowLeft size={16} strokeWidth={2.5} />
        {t.productDetailBack}
      </button>

      {product.imageUrl && (
        <div
          onClick={() => setIsLightboxOpen(true)}
          className="group relative mb-8 h-64 w-full overflow-hidden rounded-3xl sm:h-80 md:h-96 cursor-zoom-in active:scale-[0.99] transition-transform duration-300 bg-slate-950 flex items-center justify-center"
        >
          {/* Blurred Background Underlay - keeps the box fully filled with matching colors without cropping the product */}
          <img
            src={product.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover filter blur-2xl opacity-40 scale-110 pointer-events-none"
            aria-hidden="true"
          />

          {/* Centered Foreground Product Image - standard proportion, never cropped */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-auto max-w-full object-contain relative z-10 transition-transform duration-500 ease-out group-hover:scale-[1.02] pointer-events-none"
          />

          {/* Interactive Zoom Overlay */}
          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-30">
            <div className="flex items-center gap-2 rounded-2xl bg-white/25 border border-white/30 px-5 py-2.5 text-sm font-semibold text-white shadow-xl backdrop-blur-md scale-95 group-hover:scale-100 transition-transform duration-300">
              <Maximize2 size={16} strokeWidth={2.5} />
              <span>Xem ảnh toàn màn hình</span>
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent pointer-events-none z-20" />
          <span className="absolute top-4 left-4 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-md pointer-events-none z-20">{product.category}</span>
          <span className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-md pointer-events-none z-20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{t.bookingReady}
          </span>
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 pointer-events-none z-20">
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow sm:text-3xl md:text-4xl">{product.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <div className="inline-flex items-center gap-1 font-semibold text-amber-300">
                <Star size={14} fill="currentColor" />
                <span className="tabular-nums">{product.rating ?? 4.9}</span>
                <span className="font-normal text-white/70">{t.productDetailReviewUnit}</span>
              </div>
              <span className="h-3 w-px bg-white/30" aria-hidden />
              <div className="inline-flex items-center gap-1 text-white/80">
                <MapPin size={13} strokeWidth={2} />
                {/* ĐÃ FIX: Lấy vị trí thực tế của sản phẩm thay vì text cứng */}
                {product.locationText || product.location || "Chưa cập nhật vị trí"}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-6 lg:col-span-8">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t.productDetailAssurance, value: t.productDetailAssuranceValue, icon: ShieldCheck, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-500/10" },
              { label: t.productDetailSupport, value: t.productDetailSupportValue, icon: Zap, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
              { label: t.productDetailResponse, value: t.productDetailResponseValue, icon: MessageCircle, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-3 text-center shadow-sm ring-1 ring-slate-900/4 dark:border-white/8 dark:bg-white/4 dark:ring-white/4">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}><Icon size={16} strokeWidth={2} className={color} /></div>
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{label}</p>
                <p className="text-xs font-bold leading-tight text-slate-800 dark:text-slate-100">{value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/4 dark:border-white/8 dark:bg-[#101a2a] dark:ring-white/4">
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500" />
            <div className="p-6 sm:p-8">
              {!product.imageUrl && <h1 className="mb-4 text-balance text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{product.name}</h1>}
              <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                {product.summary ?? t.productDetailDefaultDescription}
              </p>
              <div className="mt-8">
                <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Thông số kỹ thuật</h2>
                <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {description.map((spec) => <ProductSpecRow key={spec} text={spec} />)}
                </ul>
              </div>
            </div>
          </div>

          {product.owner && (
            <div className="flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/4 dark:border-white/8 dark:bg-[#101a2a] dark:ring-white/4">
              <img src={product.owner.avatar} alt={product.owner.name} className="h-14 w-14 rounded-2xl object-cover ring-2 ring-slate-200 dark:ring-white/10" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Chủ sở hữu</p>
                <p className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">{product.owner.name}</p>
              </div>
              <button
                type="button"
                onClick={handleContactOwner}
                disabled={isCreatingChat || isOwner}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  isOwner
                    ? "border-slate-200 bg-slate-100 text-slate-400 dark:border-white/5 dark:bg-white/5 dark:text-slate-500"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-teal-500/30 dark:hover:bg-teal-500/10 dark:hover:text-teal-400"
                }`}
              >
                {isCreatingChat ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                ) : (
                  <MessageCircle size={18} strokeWidth={2} />
                )}
                <span>{isOwner ? "Sản phẩm của bạn" : "Nhắn tin"}</span>
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <ProductBookingCard product={product} />
        </div>
      </div>

      {/* Immersive Full-Screen Lightbox Modal */}
      {isLightboxOpen && product.imageUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop with extreme blur and dark tint */}
          <div
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl transition-opacity duration-300 cursor-zoom-out"
            onClick={() => setIsLightboxOpen(false)}
          />

          {/* Close Button */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-5 right-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-md shadow-lg transition hover:scale-105 hover:bg-white/20 active:scale-95"
            aria-label="Đóng"
          >
            <X size={20} strokeWidth={2.5} />
          </button>

          {/* Image Container */}
          <div
            className="relative max-h-[85vh] max-w-full overflow-hidden rounded-2xl shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8)] border border-white/5 bg-slate-900/40 p-2 backdrop-blur-sm animate-scaleIn select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={product.imageUrl}
              alt={product.name}
              className="max-h-[75vh] max-w-full rounded-xl object-contain"
            />
            {/* Elegant overlay caption */}
            <div className="mt-3 text-center px-4">
              <p className="text-sm font-bold text-white tracking-tight">{product.name}</p>
              <p className="mt-0.5 text-xs text-slate-400 font-medium">{product.category}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}