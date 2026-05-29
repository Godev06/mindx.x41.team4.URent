import { ChevronRight, Heart, MapPin, Star } from "lucide-react";
import type { Product } from "../../shared/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useI18n } from "../../shared/context/LanguageContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProductCardProps {
  product: Product;
  onSelect: (id: string | number) => void;
  dayUnit?: string;
  priceVnd?: number;
  location?: string;
  distanceKm?: number;
  conditionLabel?: string;
  isWishlisted?: boolean;
  onToggleWishlist?: (id: string | number) => void;
  className?: string;
}

export function ProductCard({
  product,
  onSelect,
  dayUnit,
  priceVnd,
  location,
  distanceKm,
  conditionLabel,
  isWishlisted = false,
  onToggleWishlist,
  className = "",
}: ProductCardProps) {
  const { lang } = useI18n();

  // Helper: normalize location — DB cũ có thể lưu GeoJSON object {type, coordinates}
  const normalizeLocation = (loc: unknown): string | undefined => {
    if (!loc) return undefined;
    if (typeof loc === "string") return loc || undefined;
    // GeoJSON object → bỏ qua, không hiển thị tọa độ
    if (typeof loc === "object") return undefined;
    return String(loc) || undefined;
  };

  // 1. Khắc phục logic giá tiền tệ: Phụ thuộc vào languageContext để hiển thị VND hoặc USD
  const rawPrice = priceVnd ?? product?.price;
  const hasPrice = rawPrice !== undefined && rawPrice !== null && !isNaN(Number(rawPrice));
  const numericPrice = hasPrice ? Number(rawPrice) : 0;
  const isDbVnd = priceVnd !== undefined || numericPrice > 1000;
  const priceInVnd = isDbVnd ? numericPrice : numericPrice * 25000;
  const priceInUsd = isDbVnd ? numericPrice / 25000 : numericPrice;

  const formattedPrice = hasPrice
    ? lang === "en"
      ? priceInUsd.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })
      : priceInVnd.toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
          maximumFractionDigits: 0,
        })
    : lang === "en"
    ? "Contact"
    : "Giá liên hệ";

  const displayDayUnit = dayUnit ? dayUnit.replace(/^\//, "").trim() : (lang === "vi" ? "ngày" : "day");

  // Map ID an toàn giữa MongoDB _id và id
  const productId = product._id || product.id || "";

  // 2. Khắc phục lệch key Đánh giá: ưu tiên reviewsCount từ DB
  const reviewsCount = product.reviewsCount ?? product.reviews ?? 0;

  // 3. Linh hoạt hình ảnh: hỗ trợ cả imageUrl và image
  const imageSrc = product.imageUrl || product.image;
  const isImageUrl =
    typeof imageSrc === "string" &&
    (imageSrc.startsWith("http://") ||
      imageSrc.startsWith("https://") ||
      imageSrc.startsWith("//") ||
      imageSrc.startsWith("/") ||
      imageSrc.startsWith("data:") ||
      /\.(jpg|jpeg|png|webp|gif|svg)/i.test(imageSrc));

  // Tự động fallback sang thông tin từ product document trong MongoDB nếu không truyền prop
  const displayLocation = normalizeLocation(location) ?? normalizeLocation(product.location);
  const displayCondition = conditionLabel || product.condition;

  return (
    <div
      onClick={() => onSelect(productId)}
      className={cn(
        "group relative flex flex-col w-full rounded-2xl bg-white p-3 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80",
        "cursor-pointer select-none transition-all duration-300 ease-out",
        "hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none",
        "hover:border-teal-500/30 dark:hover:border-teal-400/30",
        "focus-within:ring-2 focus-within:ring-teal-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-900",
        className
      )}
    >
      {/* Image Section Wrapper */}
      <div className={cn("relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800")}>
        {isImageUrl ? (
          <img
            src={imageSrc}
            alt={product.name}
            className={cn("h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105")}
            loading="lazy"
          />
        ) : (
          <div className={cn("flex h-full items-center justify-center text-slate-400 text-2xl bg-slate-100 dark:bg-slate-800")}>
            {typeof imageSrc === "string" && imageSrc.length > 0 ? imageSrc : "📦"}
          </div>
        )}

        {/* Gradient overlay */}
        <div className={cn("absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300")} />

        {/* Condition Badge */}
        {displayCondition && (
          <span className={cn("absolute left-2.5 top-2.5 z-10 rounded-lg bg-teal-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm dark:bg-teal-600")}>
            {displayCondition}
          </span>
        )}

        {/* Wishlist Button */}
        {onToggleWishlist && (
          <button
            type="button"
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            onClick={(event) => {
              event.stopPropagation();
              onToggleWishlist(productId);
            }}
            className={cn(
              "absolute right-2.5 top-2.5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 shadow-sm",
              isWishlisted
                ? "bg-red-50 text-red-500 dark:bg-red-950/80 dark:text-red-400"
                : "bg-white/80 text-slate-600 hover:text-red-500 hover:bg-white dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700"
            )}
          >
            <Heart
              size={16}
              fill={isWishlisted ? "currentColor" : "none"}
              className={cn(isWishlisted ? "scale-110 transition-transform" : "")}
            />
          </button>
        )}
      </div>

      {/* Content Section */}
      <div className={cn("flex-1 flex flex-col justify-between pt-3 px-0.5")}>
        <div>
          {/* Category & Location Row */}
          <div className={cn("flex items-center justify-between gap-2 mb-1")}>
            <span className={cn("text-[11px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 block truncate")}>
              {product.category || "Danh mục"}
            </span>

            {displayLocation && (
              <div className={cn("inline-flex items-center gap-0.5 text-[11px] text-slate-400 dark:text-slate-500 max-w-[50%]")}>
                <MapPin size={10} className={cn("shrink-0")} />
                <span className={cn("truncate")}>{displayLocation}</span>
              </div>
            )}
          </div>

          {/* Product Name */}
          <h3 className={cn("line-clamp-2 font-medium text-sm md:text-base text-slate-800 dark:text-slate-100 min-h-[2.5rem] leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors")}>
            {product.name}
          </h3>

          {/* Rating & Distance */}
          <div className={cn("mt-1.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400")}>
            <div className={cn("flex items-center gap-0.5 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md text-amber-700 dark:text-amber-400 font-semibold text-[11px]")}>
              <Star size={11} fill="currentColor" />
              <span>{product.rating ?? 4.8}</span>
            </div>
            <span className={cn("text-slate-300 dark:text-slate-700")}>|</span>
            <span className={cn("text-slate-500 dark:text-slate-400")}>
              {reviewsCount > 0
                ? `${reviewsCount} ${lang === "vi" ? "đánh giá" : "reviews"}`
                : lang === "vi" ? "Chưa có đánh giá" : "No reviews"}
            </span>
            {typeof distanceKm === "number" && (
              <>
                <span className={cn("text-slate-300 dark:text-slate-700")}>|</span>
                <span className={cn("text-teal-600 dark:text-teal-400 font-medium")}>{`${distanceKm}km`}</span>
              </>
            )}
          </div>
        </div>

        {/* Footer: Price and CTA Icon */}
        <div className={cn("flex items-center justify-between gap-2 mt-4 pt-2 border-t border-slate-50 dark:border-slate-800/50")}>
          <div className={cn("flex flex-col")}>
            <div className={cn("flex items-baseline gap-1")}>
              <span className={cn("text-lg md:text-xl font-bold tabular-nums text-slate-900 dark:text-white tracking-tight")}>
                {formattedPrice}
              </span>
              <span className={cn("text-[11px] font-normal text-slate-400 dark:text-slate-500")}>
                /{displayDayUnit}
              </span>
            </div>
          </div>

          {/* CTA Chevron icon */}
          <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all duration-300 group-hover:bg-teal-500 group-hover:text-white dark:group-hover:bg-teal-600")}>
            <ChevronRight size={16} className={cn("transition-transform duration-300 group-hover:translate-x-0.5")} />
          </span>
        </div>
      </div>
    </div>
  );
}