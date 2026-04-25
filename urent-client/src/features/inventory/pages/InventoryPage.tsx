import { InventoryRow } from "../components/InventoryRow";
import { AddProductModal } from "../components/AddProductModal";
import { useI18n } from "../../shared/context/LanguageContext";
import { useState, useMemo } from "react";
import {
  Package,
  AlertCircle,
  DollarSign,
  Clock,
  CheckCircle2,
  Filter,
  Plus,
} from "lucide-react";
import type { InventoryItem } from "../../shared/types";

// US03: Status Management (Available, Rented, Overdue)
const mockInventory: InventoryItem[] = [
  {
    id: 1,
    name: "Sony A7R IV Camera",
    category: "Electronics",
    price: 450000,
    statusQuantities: { available: 5, rented: 2, overdue: 1 },
    condition: "99%",
    lastUpdated: "2 mins ago",
    description: ["61.0 MP", "4K Video"],
    imageUrl:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
  },
  {
    id: 2,
    name: "DJI Mavic 3 Pro",
    category: "Outdoor",
    price: 850000,
    statusQuantities: { available: 2, rented: 3, overdue: 0 },
    condition: "New",
    lastUpdated: "1 hour ago",
    description: ["4/3 CMOS", "43 min flight"],
    imageUrl:
      "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&q=80",
  },
  {
    id: 3,
    name: "MacBook Pro M2 Max",
    category: "Electronics",
    price: 1200000,
    statusQuantities: { available: 1, rented: 0, overdue: 2 },
    condition: "95%",
    lastUpdated: "5 hours ago",
    description: ["32GB RAM", "1TB SSD"],
    imageUrl:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
  },
];

export default function InventoryPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<InventoryItem[]>(mockInventory);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "Available" | "Rented" | "Overdue"
  >("all");

  const stats = useMemo(() => {
    const available = items.reduce(
      (sum, i) => sum + i.statusQuantities.available,
      0,
    );
    const rented = items.reduce((sum, i) => sum + i.statusQuantities.rented, 0);
    const overdue = items.reduce(
      (sum, i) => sum + i.statusQuantities.overdue,
      0,
    );
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => {
      const totalQty =
        item.statusQuantities.available +
        item.statusQuantities.rented +
        item.statusQuantities.overdue;
      return sum + item.price * totalQty;
    }, 0);

    return { available, rented, overdue, totalValue, total: totalItems };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filterStatus === "all") return items;
    if (filterStatus === "Available")
      return items.filter((i) => i.statusQuantities.available > 0);
    if (filterStatus === "Rented")
      return items.filter((i) => i.statusQuantities.rented > 0);
    if (filterStatus === "Overdue")
      return items.filter((i) => i.statusQuantities.overdue > 0);
    return items;
  }, [items, filterStatus]);

  const handleAddProduct = (product: any) => {
    const newItem: InventoryItem = {
      id: Date.now(),
      name: product.name,
      category: product.category,
      price: product.price,
      statusQuantities: product.statusQuantities,
      condition: product.condition,
      lastUpdated: "Just now",
      description: product.description,
      imageUrl: product.imageUrl,
    };
    setItems([newItem, ...items]);
  };

  const handleDelete = (id: number) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const handleArchive = (id: number) => {
    setItems(items.filter((i) => i.id !== id));
  };

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6 md:p-8 font-sans selection:bg-teal-100 selection:text-teal-900">
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            {t.inventoryTitle}
            <span className="text-teal-500">.</span>
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            {t.inventoryDesc}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center gap-2 rounded-2xl bg-slate-900 dark:bg-teal-600 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all hover:scale-[1.03] active:scale-95 shadow-slate-200 dark:shadow-teal-900/20"
        >
          <Plus size={18} />
          {t.inventoryAddProduct}
        </button>
      </header>

      {/* Statistics Dashboard - Styled to match ProductCard & Showcase */}
      <section className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-5 mb-12">
        <StatCard
          icon={<Package className="text-teal-500" />}
          label={t.inventoryTotalProducts}
          value={stats.total}
        />
        <StatCard
          icon={<CheckCircle2 className="text-emerald-500" />}
          label={t.inventoryAvailable}
          value={stats.available}
          active={filterStatus === "Available"}
          onClick={() =>
            setFilterStatus(filterStatus === "Available" ? "all" : "Available")
          }
        />
        <StatCard
          icon={<Clock className="text-amber-500" />}
          label={t.inventoryRented}
          value={stats.rented}
          active={filterStatus === "Rented"}
          onClick={() =>
            setFilterStatus(filterStatus === "Rented" ? "all" : "Rented")
          }
        />
        <StatCard
          icon={<AlertCircle className="text-rose-500" />}
          label={t.inventoryOverdue}
          value={stats.overdue}
          active={filterStatus === "Overdue"}
          onClick={() =>
            setFilterStatus(filterStatus === "Overdue" ? "all" : "Overdue")
          }
        />
        <StatCard
          icon={<DollarSign className="text-teal-600" />}
          label={t.inventoryTotalValue}
          value={`${(stats.totalValue / 1000000).toFixed(1)}M`}
        />
      </section>

      {/* Catalog Table - Styled as a cohesive URent card container */}
      <section className="rounded-3xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700/50 overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-8 bg-linear-to-r from-slate-50/50 to-transparent dark:from-slate-700/20">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-none">
              {t.inventoryListTitle}
            </h2>
            <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {t.inventoryListDesc}
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex items-center gap-2">
            <div className="flex rounded-xl bg-slate-100/80 p-1 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
              <button
                onClick={() => setFilterStatus("all")}
                className={`rounded-lg px-4 py-1.5 text-[10px] font-black uppercase transition-all ${filterStatus === "all" ? "bg-white text-teal-600 shadow-sm dark:bg-slate-700 dark:text-teal-400" : "text-slate-400"}`}
              >
                {t.inventoryAll}
              </button>
              {["Rented", "Overdue"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s as any)}
                  className={`rounded-lg px-4 py-1.5 text-[10px] font-black uppercase transition-all ${filterStatus === s ? "bg-white text-teal-600 shadow-sm dark:bg-slate-700 dark:text-teal-400" : "text-slate-400"}`}
                >
                  {s === "Rented"
                    ? t.inventoryFilterRented
                    : t.inventoryFilterOverdue}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100 p-2 dark:divide-slate-700/50">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <InventoryRow
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onArchive={handleArchive}
              />
            ))
          ) : (
            <div className="py-24 text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-200 dark:text-slate-700 mb-6 border-2 border-dashed border-slate-100 dark:border-slate-800">
                <Filter size={32} />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                No matching items found
              </p>
            </div>
          )}
        </div>
      </section>

      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddProduct}
      />
    </div>
  );
}

function StatCard({ icon, label, value, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`group relative overflow-hidden rounded-3xl border p-5 sm:p-6 text-left transition-all duration-300 ${
        active
          ? "border-teal-500 bg-white shadow-teal-500/10 dark:border-teal-500 dark:bg-teal-500/5"
          : "border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-800"
      } ${onClick ? "hover:-translate-y-1 hover:shadow-2xl active:scale-95 shadow-lg shadow-slate-100 dark:shadow-none" : "shadow-md shadow-slate-100 dark:shadow-none ring-1 ring-slate-900/5 dark:ring-white/5"}`}
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900/50 transition-colors group-hover:bg-teal-500 group-hover:text-white border border-slate-100 dark:border-slate-700">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tabular-nums">
          {value}
        </span>
        <span className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-teal-500 transition-colors">
          {label}
        </span>
      </div>

      {active && (
        <div className="absolute top-0 right-0 p-2">
          <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
        </div>
      )}
    </button>
  );
}
