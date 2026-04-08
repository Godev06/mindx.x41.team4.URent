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
      className="group text-left w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-900/4 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-600/25 hover:shadow-lg hover:shadow-teal-600/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
    >
      <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/80">
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <h3 className="line-clamp-2 font-semibold leading-snug text-slate-900">{product.name}</h3>
      <p className="mt-1 line-clamp-1 text-xs font-medium uppercase tracking-wide text-slate-500">{product.category}</p>
      <div className="mt-4 flex items-end justify-between gap-2">
        <div>
          <span className="text-lg font-bold tabular-nums text-slate-900">${product.price}</span>
          <span className="text-sm font-normal text-slate-500"> / ngày</span>
        </div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white transition-colors group-hover:bg-amber-500">
          <ChevronRight size={18} strokeWidth={2.25} />
        </span>
      </div>
    </button>
  );
}
