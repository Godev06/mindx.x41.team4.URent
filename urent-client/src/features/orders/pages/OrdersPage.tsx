import { Clock } from "lucide-react";
import { PRODUCTS } from "../../shared/data";
import { Badge } from "../../shared/components/Badge";

export function OrdersPage() {
  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-500">
      <h1 className="text-2xl font-bold">Don hang</h1>

      <div className="space-y-4">
        {PRODUCTS.slice(1, 3).map((order) => (
          <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex gap-6">
            <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center text-4xl">{order.image}</div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <h3 className="font-bold text-lg">{order.name}</h3>
                <span className="font-bold">${order.price * 2}</span>
              </div>
              <p className="text-xs text-gray-400">Ma don: #URBT-85219</p>
              <div className="flex items-center gap-2 text-xs">
                <Clock size={14} /> 24/10/2024
              </div>
              <Badge variant={order.status === "Active" ? "blue" : "green"}>{order.status}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
