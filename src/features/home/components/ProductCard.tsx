import { ChevronRight } from "lucide-react";
import type { Product } from "../../shared/types";

interface ProductCardProps {
  product: Product;
  onSelect: (id: number) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(product.id)}
      className="group text-left w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm ring-1 ring-slate-900/4 dark:ring-white/4 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-600/25 dark:hover:border-teal-600/50 hover:shadow-lg hover:shadow-teal-600/8 dark:hover:shadow-teal-600/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
    >
      <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-linear-to-br from-slate-50 dark:from-slate-700 to-slate-100/80 dark:to-slate-600/80">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl transition-transform duration-200 group-hover:scale-[1.03]">
            {product.image}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-900/5 dark:from-slate-900/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <h3 className="line-clamp-2 font-semibold leading-snug text-slate-900 dark:text-slate-100">
        {product.name}
      </h3>
      <p className="mt-1 line-clamp-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {product.category}
      </p>
      <div className="mt-4 flex items-end justify-between gap-2">
        <div>
          <span className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">
            ${product.price}
          </span>
          <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
            {" "}
            / ngày
          </span>
        </div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 dark:bg-teal-700 text-white transition-colors group-hover:bg-amber-500 dark:group-hover:bg-amber-600">
          <ChevronRight size={18} strokeWidth={2.25} />
        </span>
      </div>
    </button>
  );
}
