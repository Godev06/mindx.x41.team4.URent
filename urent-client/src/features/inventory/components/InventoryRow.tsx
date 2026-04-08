import { Badge } from "../../shared/components/Badge";
import type { Product } from "../../shared/types";

interface InventoryRowProps {
  item: Product;
}

export function InventoryRow({ item }: InventoryRowProps) {
  return (
    <div className="group flex items-center gap-4 rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-slate-200 hover:bg-slate-50/80">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-200/80">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="text-2xl">{item.image}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-semibold text-slate-900">{item.name}</h4>
          <Badge variant={item.status === "Available" ? "green" : "blue"}>{item.status}</Badge>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{item.category}</p>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-800">
        ${item.price}
        <span className="font-normal text-slate-400"> / ngày</span>
      </span>
    </div>
  );
}
