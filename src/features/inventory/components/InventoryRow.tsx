import { Badge } from "../../shared/components/Badge";
import type { InventoryItem } from "../../shared/types";

interface InventoryRowProps {
  item: InventoryItem;
}

export function InventoryRow({ item }: InventoryRowProps) {
  const statusVariant =
    item.status === "In Stock"
      ? "green"
      : item.status === "Low Stock"
        ? "yellow"
        : "gray";

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-transparent dark:border-slate-700/50 px-3 py-3 transition-colors hover:border-slate-200 hover:bg-slate-50/80 dark:hover:border-slate-600 dark:hover:bg-slate-700/50">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-slate-100 dark:from-slate-600 to-slate-50 dark:to-slate-700 ring-1 ring-slate-200/80 dark:ring-slate-600/80 text-xl">
        📦
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {item.name}
          </h4>
          <Badge variant={statusVariant}>{item.status}</Badge>
        </div>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {item.category} • Số lượng: {item.quantity}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200">
        ${item.price}
        <span className="font-normal text-slate-400 dark:text-slate-500">
          {" "}
          / ngày
        </span>
      </span>
    </div>
  );
}
