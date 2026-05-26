import { ChevronRight, Heart, MapPin, Star } from "lucide-react";
import type { Product } from "../../shared/types";

interface ProductCardProps {
  product: Product;
  onSelect: (id: number) => void;
  dayUnit?: string;
  priceVnd?: number;
  location?: string;
  distanceKm?: number;
  conditionLabel?: string;
  isWishlisted?: boolean;
  onToggleWishlist?: (id: number) => void;
  className?: string; // custom tailwind class
}

export function ProductCard({
  product,
  onSelect,
  dayUnit = "ngày",
  priceVnd,
  location,
  distanceKm,
  conditionLabel,
  isWishlisted = false,
  onToggleWishlist,
  className = "",
}: ProductCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(product.id)}
      className={`group text-left w-full min-h-[55%] max-w-full flex flex-col rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-[4%] shadow-lg hover:shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/5 transition-all duration-200 hover:-translate-y-1 hover:border-teal-500/40 dark:hover:border-teal-400/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 mx-auto ${className}`}
    >
      <div className="relative aspect-[5/6] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 dark:from-slate-700 to-slate-100/80 dark:to-slate-600/80 shadow-sm">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl md:text-3xl transition-transform duration-200 group-hover:scale-[1.03]">
            {product.image}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-900/5 dark:from-slate-900/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        {conditionLabel ? (
          <span className="absolute left-3 top-3 z-10 rounded-full border border-teal-400/60 bg-white/90 px-3 py-1 text-xs font-bold text-teal-700 shadow-md dark:border-teal-400/40 dark:bg-slate-800/90 dark:text-teal-300">
            {conditionLabel}
          </span>
        ) : null}

        {onToggleWishlist ? (
          <button
            type="button"
            aria-label="toggle wishlist"
            onClick={(event) => {
              event.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className={`absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border bg-white/90 text-slate-500 shadow-sm transition hover:text-red-500 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-300 ${
              isWishlisted
                ? "border-red-200 text-red-500 dark:border-red-500/40 dark:text-red-400"
                : "border-white/70"
            }`}
          >
            <Heart
              size={15}
              fill={isWishlisted ? "currentColor" : "none"}
              strokeWidth={2.2}
            />
          </button>
        ) : null}
      </div>
      <div className="flex-1 flex flex-col justify-between mt-3">
        <div>
          <h3 className="line-clamp-2 font-semibold leading-snug text-base md:text-lg text-slate-800 dark:text-slate-100 mb-1">
            {product.name}
          </h3>
          <p className="line-clamp-1 text-[11px] md:text-xs font-medium uppercase tracking-wide text-teal-500 dark:text-teal-300 mb-2">
            {product.category}
          </p>
          {location ? (
            <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-slate-100/80 bg-slate-50 px-2 py-0.5 text-[11px] md:text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <MapPin size={12} className="text-teal-400" />
              <span>
                {location}
                {typeof distanceKm === "number" ? ` • ${distanceKm}km` : ""}
              </span>
            </div>
          ) : null}
          <div className="mb-2 inline-flex items-center gap-1 text-xs md:text-sm text-slate-400 dark:text-slate-400">
            <Star size={15} className="text-amber-400" fill="currentColor" />
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {product.rating ?? 4.8}
            </span>
            <span>{`(${product.reviews ?? 0})`}</span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-3 mt-3">
          <div>
            <span className="text-xl md:text-2xl font-bold tabular-nums text-slate-800 dark:text-white">
              {typeof priceVnd === "number"
                ? priceVnd.toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  })
                : `$${product.price}`}
            </span>
            <br></br>
            <span className="text-xs md:text-sm font-normal text-slate-500 dark:text-slate-300">
              {` ${dayUnit}`}
            </span>
          </div>
          <span className="inline-flex h-[2.2rem] w-[2.2rem] items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 dark:from-teal-700 dark:to-cyan-700 text-white shadow transition-all duration-200 group-hover:from-amber-400 group-hover:to-amber-500 dark:group-hover:from-amber-500 dark:group-hover:to-amber-600">
            <ChevronRight size={20} strokeWidth={2.25} />
          </span>
        </div>
      </div>
    </button>
  );
}
