import type { InventoryItem } from "../../shared/types";
import {
  Edit,
  Archive,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  Loader2,
  MapPin,
} from "lucide-react";
import { useI18n } from "../../shared/context/LanguageContext";

interface InventoryRowProps {
  item: InventoryItem;
  onDelete: (id: string | number) => void;
  onArchive: (id: string | number) => void;
  onEdit: (item: InventoryItem) => void;
  isDeleting?: boolean;
}

export function InventoryRow({ item, onDelete, onArchive, onEdit, isDeleting }: InventoryRowProps) {
  const { t, lang } = useI18n();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(price);

  const totalQty =
    (item.statusQuantities?.available ?? 0) +
    (item.statusQuantities?.rented ?? 0) +
    (item.statusQuantities?.overdue ?? 0);

  const statusBadge = () => {
    const overdue = item.statusQuantities?.overdue ?? 0;
    const rented = item.statusQuantities?.rented ?? 0;
    const available = item.statusQuantities?.available ?? 0;
    if (overdue > 0) return { label: lang === "vi" ? "Quá hạn" : "Overdue", cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" };
    if (rented > 0 && available === 0) return { label: lang === "vi" ? "Đang thuê" : "All Rented", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
    return { label: lang === "vi" ? "Sẵn có" : "Available", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
  };

  const badge = statusBadge();

  return (
    <div className={`group flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 transition-all rounded-2xl ${isDeleting ? "opacity-50 pointer-events-none" : "hover:bg-slate-50 dark:hover:bg-slate-700/30"}`}>
      <div className="flex items-center gap-4">
        {/* Product Image */}
        <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex-shrink-0 border border-slate-100 dark:border-slate-700 shadow-sm">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
              <Package size={24} />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate max-w-[200px] sm:max-w-xs">
            {item.name}
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {item.category}
            </span>
            {item.condition && (
              <>
                <span className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{item.condition}</span>
              </>
            )}
          </div>
          {/* Location */}
          {item.locationText && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              <MapPin size={9} className="text-teal-400 flex-shrink-0" />
              <span className="truncate max-w-[180px]">{item.locationText}</span>
            </div>
          )}
          {/* Description tags */}
          {item.description && item.description.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {item.description.slice(0, 2).map((spec, i) => (
                <span
                  key={i}
                  className="rounded-md bg-slate-100/70 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-900/50 dark:text-slate-400 border border-slate-100 dark:border-slate-800"
                >
                  {spec}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status & Price & Actions */}
      <div className="mt-4 sm:mt-0 flex flex-wrap items-center gap-5">
        {/* Status badge */}
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${badge.cls}`}>
          {badge.label}
        </span>

        {/* Quantity breakdown */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1 text-emerald-500">
              <CheckCircle2 size={13} strokeWidth={2.5} />
              <span className="text-xs font-black tabular-nums">{item.statusQuantities?.available ?? 0}</span>
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{t.inventoryRowFree}</span>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1 text-amber-500">
              <Clock size={13} strokeWidth={2.5} />
              <span className="text-xs font-black tabular-nums">{item.statusQuantities?.rented ?? 0}</span>
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{t.inventoryRowRent}</span>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1 text-rose-500">
              <AlertCircle size={13} strokeWidth={2.5} />
              <span className="text-xs font-black tabular-nums">{item.statusQuantities?.overdue ?? 0}</span>
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{t.inventoryRowOver}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-slate-100 dark:bg-slate-700 hidden sm:block" />

        {/* Price */}
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-slate-800 dark:text-white tabular-nums">
            {formatPrice(item.price)}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            / {t.inventoryRowDay} {totalQty > 1 && `× ${totalQty}`}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
          <button
            onClick={() => onEdit(item)}
            title={lang === "vi" ? "Chỉnh sửa" : "Edit"}
            className="rounded-xl p-2.5 text-slate-400 hover:bg-white hover:text-teal-600 dark:hover:bg-slate-700 shadow-sm transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-600 hover:scale-110 active:scale-95"
          >
            <Edit size={15} />
          </button>
          <button
            onClick={() => onArchive(item.id)}
            title={lang === "vi" ? "Lưu trữ" : "Archive"}
            className="rounded-xl p-2.5 text-slate-400 hover:bg-white hover:text-amber-500 dark:hover:bg-slate-700 shadow-sm transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-600 hover:scale-110 active:scale-95"
          >
            <Archive size={15} />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            disabled={isDeleting}
            title={lang === "vi" ? "Xóa" : "Delete"}
            className="rounded-xl p-2.5 text-slate-400 hover:bg-white hover:text-rose-500 dark:hover:bg-slate-700 shadow-sm transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-600 hover:scale-110 active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}