import { INVENTORY_ITEMS } from "../../shared/data";
import { Badge } from "../../shared/components/Badge";
import { useTheme } from "../../settings/context/ThemeContext.tsx";
import { InventoryRow } from "../components/InventoryRow";

export function InventoryPage() {
  const { theme } = useTheme();
  const activeCount = INVENTORY_ITEMS.filter(
    (item) => item.status === "In Stock",
  ).length;
  const lowStockCount = INVENTORY_ITEMS.filter(
    (item) => item.status === "Low Stock",
  ).length;
  const totalValue = INVENTORY_ITEMS.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1
          className={`text-2xl font-bold tracking-tight ${
            theme === "dark" ? "text-slate-100" : "text-slate-900"
          }`}
        >
          Kho hàng của tôi
        </h1>
        <p
          className={`mt-1 text-sm ${
            theme === "dark" ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Theo dõi và quản lý sản phẩm đang cho thuê.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div
          className={`rounded-2xl border p-4 shadow-sm ring-1 ${
            theme === "dark"
              ? "border-slate-700 bg-slate-900 ring-white/10"
              : "border-slate-200/90 bg-white ring-slate-900/4"
          }`}
        >
          <p
            className={`text-xs font-medium ${
              theme === "dark" ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Tổng sản phẩm
          </p>
          <p
            className={`mt-2 text-2xl font-bold ${
              theme === "dark" ? "text-slate-100" : "text-slate-900"
            }`}
          >
            {INVENTORY_ITEMS.length}
          </p>
        </div>
        <div
          className={`rounded-2xl border p-4 shadow-sm ring-1 ${
            theme === "dark"
              ? "border-slate-700 bg-slate-900 ring-white/10"
              : "border-slate-200/90 bg-white ring-slate-900/4"
          }`}
        >
          <p
            className={`text-xs font-medium ${
              theme === "dark" ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Có sẵn/Cảnh báo
          </p>
          <p
            className={`mt-2 text-2xl font-bold ${
              theme === "dark" ? "text-slate-100" : "text-slate-900"
            }`}
          >
            {activeCount}/{lowStockCount}
          </p>
        </div>
        <div
          className={`rounded-2xl border p-4 shadow-sm ring-1 ${
            theme === "dark"
              ? "border-slate-700 bg-slate-900 ring-white/10"
              : "border-slate-200/90 bg-white ring-slate-900/4"
          }`}
        >
          <p
            className={`text-xs font-medium ${
              theme === "dark" ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Tổng giá trị kho
          </p>
          <p
            className={`mt-2 text-2xl font-bold ${
              theme === "dark" ? "text-slate-100" : "text-slate-900"
            }`}
          >
            ${totalValue}
          </p>
        </div>
      </section>

      <div
        className={`overflow-hidden rounded-2xl border shadow-sm ring-1 ${
          theme === "dark"
            ? "border-slate-700 bg-slate-900 ring-white/10"
            : "border-slate-200/90 bg-white ring-slate-900/4"
        }`}
      >
        <div
          className={`flex items-center justify-between border-b px-6 py-4 ${
            theme === "dark" ? "border-slate-700" : "border-slate-100"
          }`}
        >
          <div>
            <h2
              className={`text-sm font-semibold ${
                theme === "dark" ? "text-slate-100" : "text-slate-900"
              }`}
            >
              Danh sách hàng hóa
            </h2>
            <p
              className={`text-xs ${
                theme === "dark" ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Cập nhật trạng thái và giá theo thời gian thực.
            </p>
          </div>
          <Badge variant="gray">Sync live</Badge>
        </div>
        <div
          className={`divide-y px-2 py-1 ${
            theme === "dark" ? "divide-slate-800" : "divide-slate-100"
          }`}
        >
          {INVENTORY_ITEMS.map((item) => (
            <InventoryRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
