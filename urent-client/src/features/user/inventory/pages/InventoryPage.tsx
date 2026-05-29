import React from "react";
import { InventoryRow } from "../components/InventoryRow";
import { AddProductModal } from "../components/AddProductModal";
import { EditProductModal } from "../components/EditProductModal";
import { useI18n } from "../../shared/context/LanguageContext";
import { useState, useMemo, useEffect, useCallback } from "react";
import { productService } from "../../product/services/productService";
import { useToast } from "../../shared/hooks/useToast";
import {
  Package,
  AlertCircle,
  DollarSign,
  Clock,
  CheckCircle2,
  Filter,
  Plus,
  RefreshCw,
} from "lucide-react";
import type { InventoryItem, Product } from "../../shared/types";

type ExtendedProduct = Product & {
  _id?: string;
  locationText?: string;
  statusQuantities?: {
    available: number;
    rented: number;
    overdue: number;
  };
};

export default function InventoryPage() {
  const { t, lang } = useI18n();
  const { showToast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "Available" | "Rented" | "Overdue"
  >("all");
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  // ─── Fetch inventory for current user ────────────────────────────────────
  const fetchInventory = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const products = (await productService.getMyProducts({
        limit: 100,
      })) as ExtendedProduct[];

      const mapped: InventoryItem[] = products.map((p) => ({
        id: p._id || p.id || "",
        name: p.name,
        category: p.category,
        price: p.price,
        locationText: p.locationText || "Chưa cập nhật vị trí",
        location: p.locationText || "Chưa cập nhật vị trí",
        statusQuantities: p.statusQuantities || {
          available: 1,
          rented: 0,
          overdue: 0,
        },
        condition: p.condition || "New",
        lastUpdated: "Recently",
        description: p.description,
        imageUrl: p.imageUrl,
      }));
      setItems(mapped);
    } catch (err) {
      console.error("Failed to load inventory:", err);
      showToast({
        title: lang === "vi" ? "Lỗi tải kho hàng" : "Failed to load inventory",
        description: lang === "vi" ? "Vui lòng thử lại." : "Please try again.",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [lang, showToast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const available = items.reduce((sum, i) => sum + (i.statusQuantities?.available ?? 0), 0);
    const rented = items.reduce((sum, i) => sum + (i.statusQuantities?.rented ?? 0), 0);
    const overdue = items.reduce((sum, i) => sum + (i.statusQuantities?.overdue ?? 0), 0);
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => {
      const totalQty =
        (item.statusQuantities?.available ?? 0) +
        (item.statusQuantities?.rented ?? 0) +
        (item.statusQuantities?.overdue ?? 0);
      return sum + item.price * totalQty;
    }, 0);
    return { available, rented, overdue, totalValue, total: totalItems };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filterStatus === "all") return items;
    if (filterStatus === "Available") return items.filter((i) => (i.statusQuantities?.available ?? 0) > 0);
    if (filterStatus === "Rented") return items.filter((i) => (i.statusQuantities?.rented ?? 0) > 0);
    if (filterStatus === "Overdue") return items.filter((i) => (i.statusQuantities?.overdue ?? 0) > 0);
    return items;
  }, [items, filterStatus]);

  // ─── Add product ──────────────────────────────────────────────────────────
  const handleAddProduct = async (product: any) => {
    // Geocode address to real coordinates via OpenStreetMap (free)
    let lng = 105.8342, lat = 21.0278;
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(product.locationText)}&limit=1`
      );
      const geoData = await geoRes.json();
      if (geoData?.length > 0) {
        lat = parseFloat(geoData[0].lat);
        lng = parseFloat(geoData[0].lon);
      }
    } catch {
      // Silently fall back to Hanoi defaults
    }

    // Throws on API error — modal will catch and show inline error message
    await productService.createProduct({
      name: product.name,
      category: product.category,
      price: product.price,
      locationText: product.locationText,
      location: { type: "Point", coordinates: [lng, lat] },
      statusQuantities: product.statusQuantities,
      condition: product.condition,
      imageUrl: product.imageUrl,
      description: product.description,
    } as any);

    // Success — show toast, refresh list silently
    showToast({
      title: lang === "vi" ? "Đã đăng sản phẩm! 🎉" : "Product added! 🎉",
      description: lang === "vi"
        ? `"${product.name}" đã được đăng lên kho hàng của bạn.`
        : `"${product.name}" is now live in your inventory.`,
      variant: "success",
    });
    fetchInventory(true);
  };


  // ─── Edit ──────────────────────────────────────────────────────────────────
  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  // ─── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string | number) => {
    const item = items.find((i) => i.id === id);
    if (!confirm(lang === "vi" ? `Xóa "${item?.name}"? Hành động này không thể hoàn tác.` : `Delete "${item?.name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await productService.deleteProduct(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast({
        title: lang === "vi" ? "Đã xóa sản phẩm" : "Product deleted",
        variant: "success",
      });
    } catch (err: any) {
      showToast({
        title: lang === "vi" ? "Lỗi xóa sản phẩm" : "Delete failed",
        description: err?.message,
        variant: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Archive ───────────────────────────────────────────────────────────────
  const handleArchive = async (id: string | number) => {
    const item = items.find((i) => i.id === id);
    if (!confirm(lang === "vi" ? `Lưu trữ "${item?.name}"?` : `Archive "${item?.name}"?`)) return;
    try {
      await productService.archiveProduct(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast({
        title: lang === "vi" ? "Đã lưu trữ sản phẩm" : "Product archived",
        variant: "success",
      });
    } catch (err: any) {
      showToast({
        title: lang === "vi" ? "Lỗi lưu trữ" : "Archive failed",
        description: err?.message,
        variant: "error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6 md:p-8 font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* ─── Header ─── */}
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
        <div className="flex items-center gap-3">
          {/* Refresh button */}
          <button
            onClick={() => fetchInventory(true)}
            disabled={isRefreshing}
            className="flex items-center justify-center h-12 w-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-teal-500 hover:border-teal-300 dark:hover:border-teal-600 transition-all hover:scale-105 active:scale-95 shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          </button>
          {/* Add button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center gap-2 rounded-2xl bg-slate-900 dark:bg-teal-600 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all hover:scale-[1.03] hover:shadow-2xl active:scale-95 shadow-slate-200 dark:shadow-teal-900/20"
          >
            <Plus size={16} className="transition-transform group-hover:rotate-90 duration-300" />
            {t.inventoryAddProduct}
          </button>
        </div>
      </header>

      {/* ─── Stats grid ─── */}
      <section className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-5 mb-12">
        <StatCard icon={<Package className="text-teal-500" />} label={t.inventoryTotalProducts} value={stats.total} />
        <StatCard
          icon={<CheckCircle2 className="text-emerald-500" />}
          label={t.inventoryAvailable}
          value={stats.available}
          active={filterStatus === "Available"}
          onClick={() => setFilterStatus(filterStatus === "Available" ? "all" : "Available")}
        />
        <StatCard
          icon={<Clock className="text-amber-500" />}
          label={t.inventoryRented}
          value={stats.rented}
          active={filterStatus === "Rented"}
          onClick={() => setFilterStatus(filterStatus === "Rented" ? "all" : "Rented")}
        />
        <StatCard
          icon={<AlertCircle className="text-rose-500" />}
          label={t.inventoryOverdue}
          value={stats.overdue}
          active={filterStatus === "Overdue"}
          onClick={() => setFilterStatus(filterStatus === "Overdue" ? "all" : "Overdue")}
        />
        <StatCard
          icon={<DollarSign className="text-teal-600" />}
          label={t.inventoryTotalValue}
          value={`${(stats.totalValue / 1_000_000).toFixed(1)}M`}
        />
      </section>

      {/* ─── Product table ─── */}
      <section className="rounded-3xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700/50 overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-8 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-700/20">
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
                className={`rounded-lg px-4 py-1.5 text-[10px] font-black uppercase transition-all ${
                  filterStatus === "all"
                    ? "bg-white text-teal-600 shadow-sm dark:bg-slate-700 dark:text-teal-400"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
              >
                {t.inventoryAll}
              </button>
              {(["Rented", "Overdue"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`rounded-lg px-4 py-1.5 text-[10px] font-black uppercase transition-all ${
                    filterStatus === s
                      ? "bg-white text-teal-600 shadow-sm dark:bg-slate-700 dark:text-teal-400"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  {s === "Rented" ? t.inventoryFilterRented : t.inventoryFilterOverdue}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100 p-2 dark:divide-slate-700/50">
          {isLoading ? (
            /* Skeleton loading */
            <div className="py-6 space-y-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-5 p-6 animate-pulse">
                  <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-lg w-2/5" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-lg w-1/4" />
                    <div className="flex gap-1.5 mt-1">
                      <div className="h-5 w-16 bg-slate-100 dark:bg-slate-700 rounded-md" />
                      <div className="h-5 w-20 bg-slate-100 dark:bg-slate-700 rounded-md" />
                    </div>
                  </div>
                  <div className="flex gap-6">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="flex flex-col items-center gap-1">
                        <div className="h-5 w-8 bg-slate-100 dark:bg-slate-700 rounded" />
                        <div className="h-3 w-6 bg-slate-100 dark:bg-slate-700 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <InventoryRow
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onEdit={handleEditClick}
                isDeleting={deletingId === item.id}
              />
            ))
          ) : items.length === 0 ? (
            /* No products at all */
            <div className="py-24 text-center">
              <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-teal-50 to-slate-50 dark:from-teal-950/30 dark:to-slate-900/50 flex items-center justify-center mb-6 border-2 border-dashed border-teal-200 dark:border-teal-800 shadow-inner">
                <Package size={36} className="text-teal-400 dark:text-teal-600" />
              </div>
              <p className="text-base font-black text-slate-500 dark:text-slate-400">
                {lang === "vi" ? "Kho hàng trống!" : "Your inventory is empty!"}
              </p>
              <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                {lang === "vi" ? "Nhấn \"Thêm hàng mới\" để bắt đầu kiếm tiền." : "Click \"Add New Item\" to start earning."}
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-teal-500 hover:bg-teal-400 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-teal-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <Plus size={14} />
                {t.inventoryAddProduct}
              </button>
            </div>
          ) : (
            /* No results for current filter */
            <div className="py-24 text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-200 dark:text-slate-700 mb-6 border-2 border-dashed border-slate-100 dark:border-slate-800">
                <Filter size={32} />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                {lang === "vi" ? "Không tìm thấy mục phù hợp" : "No matching items"}
              </p>
              <button
                onClick={() => setFilterStatus("all")}
                className="mt-4 text-xs font-bold text-teal-500 hover:underline"
              >
                {lang === "vi" ? "Xem tất cả" : "Show all"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ─── Modals ─── */}
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddProduct}
      />

      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        product={editingItem}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
          showToast({
            title: lang === "vi" ? "Cập nhật thành công! ✅" : "Updated successfully! ✅",
            variant: "success",
          });
          fetchInventory(true);
        }}
      />
    </div>
  );
}

// ─── StatCard component ───────────────────────────────────────────────────────
function StatCard({ icon, label, value, active, onClick }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`group relative overflow-hidden rounded-3xl border p-5 sm:p-6 text-left transition-all duration-300 ${
        active
          ? "border-teal-500 bg-white shadow-teal-500/10 dark:border-teal-500 dark:bg-teal-500/5 shadow-lg"
          : "border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-800"
      } ${
        onClick
          ? "hover:-translate-y-1 hover:shadow-2xl active:scale-95 shadow-lg shadow-slate-100 dark:shadow-none cursor-pointer"
          : "shadow-md shadow-slate-100 dark:shadow-none ring-1 ring-slate-900/5 dark:ring-white/5 cursor-default"
      }`}
    >
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border transition-colors duration-300 ${
        active
          ? "bg-teal-500 text-white border-transparent"
          : "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700 group-hover:bg-teal-500 group-hover:text-white group-hover:border-transparent"
      }`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tabular-nums">
          {value}
        </span>
        <span className={`mt-1 text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${
          active ? "text-teal-500" : "text-slate-400 group-hover:text-teal-500"
        }`}>
          {label}
        </span>
      </div>
      {active && (
        <div className="absolute top-3 right-3">
          <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
        </div>
      )}
      {/* Glow effect on active */}
      {active && (
        <div className="absolute inset-0 rounded-3xl ring-1 ring-teal-500/20 pointer-events-none" />
      )}
    </button>
  );
}
