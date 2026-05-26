import { Flame } from "lucide-react";
import type { Product } from "../../shared/types";
import { ProductCard } from "./ProductCard";

interface FeaturedProductsProps {
  products: Product[];
  onProductClick: (id: string | number) => void;
  lang: "vi" | "en";
  dayUnit?: string;
  priceConverter?: (price: number) => number;
  productMeta?: Record<string | number, any>;
  onViewMore?: () => void;
}

export function FeaturedProducts({
  products,
  onProductClick,
  lang,
  dayUnit = "/ ngày",
  priceConverter = (p) => p,
  productMeta = {},
  onViewMore,
}: FeaturedProductsProps) {
  const t =
    lang === "vi"
      ? {
          title: "🔥 Sản phẩm hot",
          subtitle: "Những vật phẩm được yêu thích nhất",
          viewMore: "Xem thêm",
        }
      : {
          title: "🔥 Hot products",
          subtitle: "Most loved items",
          viewMore: "View more",
        };

  const topProducts = products.slice(0, 4);

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <Flame className="text-orange-500" size={24} />
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t.subtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {topProducts.map((product) => {
          const meta = productMeta[product.id] || {
            locationVi: product.location || (lang === "vi" ? "Chưa cập nhật" : "Unknown"),
            locationEn: product.location || "Unknown",
            distanceKm: undefined,
            conditionVi: product.condition || (lang === "vi" ? "Tốt" : "Good"),
            conditionEn: product.condition || "Good",
          };
          const location = lang === "vi" ? meta?.locationVi : meta?.locationEn;
          const conditionLabel =
            lang === "vi" ? meta?.conditionVi : meta?.conditionEn;

          return (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onProductClick}
              dayUnit={dayUnit}
              priceVnd={priceConverter(product.price)}
              location={location}
              distanceKm={meta?.distanceKm}
              conditionLabel={conditionLabel}
            />
          );
        })}
      </div>

      {onViewMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onViewMore}
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-teal-500 bg-teal-50 px-6 py-3 text-sm font-semibold text-teal-700 transition hover:border-teal-600 hover:bg-teal-100 dark:border-teal-500/60 dark:bg-teal-500/10 dark:text-teal-300 dark:hover:bg-teal-500/20"
          >
            {t.viewMore}
          </button>
        </div>
      )}
    </section>
  );
}
