import type { InventoryItem } from "../../shared/types";
import {
  Edit,
  Archive,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
} from "lucide-react";
import { useI18n } from "../../shared/context/LanguageContext";

interface InventoryRowProps {
  item: InventoryItem;
  onDelete: (id: number) => void;
  onArchive: (id: number) => void;
}

export function InventoryRow({ item, onDelete, onArchive }: InventoryRowProps) {
  const { t } = useI18n();

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 transition-all hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-2xl">
      <div className="flex items-center gap-5">
        {/* Product Image */}
        <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex-shrink-0 border border-slate-100 dark:border-slate-700">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <Package size={24} />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-1">
          <h4 className="text-base font-bold text-slate-800 dark:text-white leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
            {item.name}
          </h4>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>{item.category}</span>
            <span className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            <span>{item.condition}</span>
          </div>
          {item.description && item.description.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {item.description.slice(0, 2).map((spec, i) => (
                <span
                  key={i}
                  className="rounded-md bg-slate-100/50 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-900/50 dark:text-slate-400 border border-slate-100 dark:border-slate-800"
                >
                  {spec}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Breakdown (Updated for US) */}
      <div className="mt-4 sm:mt-0 flex flex-wrap items-center gap-6">
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={14} strokeWidth={2.5} />
            <span className="text-xs font-black tabular-nums">
              {item.statusQuantities.available}
            </span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            {t.inventoryRowFree}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5 text-amber-500">
            <Clock size={14} strokeWidth={2.5} />
            <span className="text-xs font-black tabular-nums">
              {item.statusQuantities.rented}
            </span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            {t.inventoryRowRent}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5 text-rose-500">
            <AlertCircle size={14} strokeWidth={2.5} />
            <span className="text-xs font-black tabular-nums">
              {item.statusQuantities.overdue}
            </span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            {t.inventoryRowOver}
          </span>
        </div>

        <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-700 hidden sm:block mx-2" />

        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-slate-800 dark:text-white tabular-nums">
            {item.price.toLocaleString()}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            VND / {t.inventoryRowDay}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 ml-4">
          <button className="rounded-xl p-2.5 text-slate-400 hover:bg-white hover:text-teal-600 dark:hover:bg-slate-700 shadow-sm transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-600">
            <Edit size={16} />
          </button>
          <button
            onClick={() => onArchive(item.id)}
            className="rounded-xl p-2.5 text-slate-400 hover:bg-white hover:text-amber-600 dark:hover:bg-slate-700 shadow-sm transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-600"
          >
            <Archive size={16} />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="rounded-xl p-2.5 text-slate-400 hover:bg-white hover:text-rose-600 dark:hover:bg-slate-700 shadow-sm transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
