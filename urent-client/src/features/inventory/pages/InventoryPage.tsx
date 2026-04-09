import { INVENTORY_ITEMS } from "../../shared/data";
import { Badge } from "../../shared/components/Badge";
import { InventoryRow } from "../components/InventoryRow";

export function InventoryPage() {
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Kho hàng của tôi
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Theo dõi và quản lý sản phẩm đang cho thuê.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04]">
          <p className="text-xs font-medium text-slate-500">Tổng sản phẩm</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {INVENTORY_ITEMS.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04]">
          <p className="text-xs font-medium text-slate-500">Có sẵn/Cảnh báo</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {activeCount}/{lowStockCount}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04]">
          <p className="text-xs font-medium text-slate-500">Tổng giá trị kho</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            ${totalValue}
          </p>
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Danh sách hàng hóa
            </h2>
            <p className="text-xs text-slate-500">
              Cập nhật trạng thái và giá theo thời gian thực.
            </p>
          </div>
          <Badge variant="gray">Sync live</Badge>
        </div>
        <div className="divide-y divide-slate-100 px-2 py-1">
          {INVENTORY_ITEMS.map((item) => (
            <InventoryRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
