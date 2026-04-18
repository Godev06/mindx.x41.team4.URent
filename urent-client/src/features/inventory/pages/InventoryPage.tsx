import { useState, useEffect } from "react";
import { INVENTORY_ITEMS } from "../../shared/data";
import { useTheme } from "../../settings/hooks/useTheme";
import { InventoryRow } from "../components/InventoryRow";
import { useI18n } from "../../shared/context/LanguageContext";
import type { InventoryItem } from "../../shared/types";

export function InventoryPage() {
  const { theme } = useTheme();
  const { lang } = useI18n();

  const [items, setItems] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("inventory");
      return saved ? JSON.parse(saved) : INVENTORY_ITEMS;
    } catch {
      return INVENTORY_ITEMS;
    }
  });

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    localStorage.setItem("inventory", JSON.stringify(items));
  }, [items]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredItems = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());

    const matchFilter = filter === "all" ? true : item.status === filter;

    return matchSearch && matchFilter;
  });

  const handleDelete = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdate = (updatedItem: InventoryItem) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    );
    setEditingItem(null);
  };

  const t =
    lang === "vi"
      ? {
          title: "Kho hàng của tôi",
          desc: "Theo dõi và quản lý sản phẩm đang cho thuê.",
          empty: "Chưa có vật phẩm",
          search: "Tìm sản phẩm...",
          all: "Tất cả",
        }
      : {
          title: "My Inventory",
          desc: "Track and manage your listed rental products.",
          empty: "No items",
          search: "Search...",
          all: "All",
        };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-sm text-slate-400">{t.desc}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          placeholder={t.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
        >
          <option value="all">{t.all}</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out</option>
        </select>
      </div>

      {/* LIST */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900">
        <div className="divide-y divide-slate-800 px-2 py-1">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-slate-400">{t.empty}</div>
          ) : (
            filteredItems.map((item) => (
              <InventoryRow
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onEdit={() => setEditingItem(item)}
              />
            ))
          )}
        </div>
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-2xl w-[480px] border border-slate-700 shadow-xl">
            <h2 className="text-white mb-4 font-semibold text-lg">
              Sửa sản phẩm
            </h2>

            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <input
                  className="w-full mb-3 p-2 rounded bg-slate-800 text-white"
                  value={editingItem.name}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      name: e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  className="w-full mb-3 p-2 rounded bg-slate-800 text-white"
                  value={editingItem.quantity}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      quantity: Number(e.target.value),
                    })
                  }
                />

                <input
                  type="number"
                  className="w-full p-2 rounded bg-slate-800 text-white"
                  value={editingItem.price}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      price: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-slate-700 rounded"
              >
                Hủy
              </button>

              <button
                onClick={() => handleUpdate(editingItem)}
                className="px-4 py-2 bg-green-600 rounded"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
