import type { InventoryItem } from "../../shared/types";
import { useI18n } from "../../shared/context/LanguageContext";

interface InventoryRowProps {
  item: InventoryItem;
  onDelete?: (id: number) => void;
  onEdit?: () => void;
}

export function InventoryRow({ item, onDelete, onEdit }: InventoryRowProps) {
  const { lang } = useI18n();

  const statusVariant =
    item.status === "In Stock"
      ? "green"
      : item.status === "Low Stock"
        ? "yellow"
        : "gray";

  const statusClass =
    statusVariant === "green"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : statusVariant === "yellow"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : "border-slate-600/50 bg-slate-700/30 text-slate-300";

  return (
    <div className="group flex items-center gap-4 px-4 py-3 rounded-xl border border-transparent dark:border-slate-700/50 transition-all hover:bg-slate-800/60 hover:border-slate-600">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-semibold text-white truncate">
            {item.name}
          </h4>

          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass}`}
          >
            {item.status}
          </span>
        </div>

        <p className="text-xs text-slate-400 mt-0.5">
          {item.category} • {lang === "vi" ? "Số lượng" : "Quantity"}:{" "}
          <span className="text-slate-200 font-medium">{item.quantity}</span>
        </p>
      </div>

      {/* PRICE */}
      <div className="text-right min-w-[80px]">
        <div className="text-sm font-semibold text-white whitespace-nowrap">
          ${item.price}
          <span className="text-xs text-slate-400 font-normal ml-1">
            {lang === "vi" ? "/ ngày" : "/ day"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={() => onEdit?.()}
          className="text-xs px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
        >
          {lang === "vi" ? "Sửa" : "Edit"}
        </button>

        <button
          onClick={() => onDelete?.(item.id)}
          className="text-xs px-2 py-1 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20"
        >
          {lang === "vi" ? "Xóa" : "Delete"}
        </button>
      </div>
    </div>
  );
}
