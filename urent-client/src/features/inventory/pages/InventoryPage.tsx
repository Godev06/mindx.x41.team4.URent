import { PRODUCTS } from "../../shared/data";
import { Badge } from "../../shared/components/Badge";

export function InventoryPage() {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold">Kho hang cua toi</h1>
        <p className="text-sm text-gray-500">Theo doi va quan ly cac san pham dang cho thue.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold mb-6">Danh sach hang hoa</h3>
        <div className="space-y-4">
          {PRODUCTS.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">{item.image}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm">{item.name}</h4>
                  <Badge variant={item.status === "Available" ? "green" : "blue"}>{item.status}</Badge>
                </div>
                <p className="text-xs text-gray-400">{item.category}</p>
              </div>
              <span className="text-sm font-bold">${item.price} / ngay</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
