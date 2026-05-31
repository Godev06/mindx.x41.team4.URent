import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "../layout/AdminLayout";
import { apiClient } from "../../../lib/api/apiClient";
import {
  Search,
  ShoppingBag,
  Clock,
  CheckCircle2,
  MessageSquare,
  Calendar,
  ArrowUpRight
} from "lucide-react";

export function AdminOrdersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/api/v1/orders/admin/all");
      if (response.data && response.data.success) {
        setOrders(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch admin orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);



  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Đang xử lý";
      case "confirmed":
      case "shipped":
        return "Đang thuê";
      case "delivered": return "Đã trả";
      case "cancelled": return "Đã hủy";
      default: return status;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "confirmed" || status === "shipped") {
      return "bg-teal-500/10 text-teal-400 border border-teal-500/25";
    }
    if (status === "pending") {
      return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25";
    }
    if (status === "cancelled") {
      return "bg-rose-500/10 text-rose-400 border border-rose-500/25";
    }
    return "bg-slate-900/50 text-slate-400 border border-slate-800";
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const term = searchTerm.toLowerCase();
    const customerName = (o.customerName || "").toLowerCase();
    const orderCode = (o.orderCode || "").toLowerCase();
    const productName = (o.productName || "").toLowerCase();
    return customerName.includes(term) || orderCode.includes(term) || productName.includes(term);
  });

  return (
    <AdminLayout>
      <div className="space-y-10">
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Orders Management
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-400">
              Manage platform transactions, rental activities, and coordinate dispute settlements
            </p>
          </div>

          {/* SEARCH BAR */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by renter name, code, or item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 py-3 pl-11 pr-4 text-sm font-medium text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:bg-slate-900 focus:outline-none transition duration-300 shadow-md shadow-slate-950/20"
            />
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* STAT 1 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-lg shadow-slate-950/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Transactions</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-white">{orders.length}</h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>

          {/* STAT 2 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-lg shadow-slate-950/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Renting Active</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-teal-400">
                {orders.filter((o) => o.status === "confirmed" || o.status === "shipped").length}
              </h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/25 text-teal-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          {/* STAT 3 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-lg shadow-slate-950/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Renting Pending</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-yellow-400">
                {orders.filter((o) => o.status === "pending").length}
              </h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-500/10 border border-yellow-500/25 text-yellow-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* ORDER LIST CONTAINER */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-md shadow-xl shadow-slate-950/25">
          {/* HEADER ROW */}
          <div className="grid grid-cols-5 border-b border-slate-850 bg-slate-950/45 px-6 py-4.5 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
            <p>Renter details</p>
            <p>Product & Price</p>
            <p className="text-center">Communication</p>
            <p className="text-center">Rental state</p>
            <p className="text-right">Order date</p>
          </div>

          {/* DATA GRID */}
          <div className="divide-y divide-slate-850">
            {isLoading ? (
              <div className="text-center py-20 text-slate-500">Loading platform transactions...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
                <ShoppingBag className="h-10 w-10 text-slate-600 animate-pulse" />
                <p className="text-sm font-semibold">No transactions found</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
            
                return (
                  <div
                    key={order._id}
                    onClick={() => navigate(`/admin/orders/${order._id}`)}
                    className="grid cursor-pointer grid-cols-5 items-center px-6 py-5 transition duration-300 hover:bg-slate-900/40 group"
                  >
                    {/* RENTER INFO */}
                    <div className="flex flex-col min-w-0 pr-4">
                      <p className="font-bold text-white text-sm truncate group-hover:text-cyan-400 transition-colors duration-150">
                        {order.customerName || order.renterId?.displayName || "Platform Renter"}
                      </p>
                      <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{order.orderCode}</p>
                    </div>

                    {/* PRODUCT & PRICE */}
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-xs font-bold text-slate-300 truncate">
                        {order.productName}
                      </span>
                      <span className="text-[11px] text-cyan-400 font-bold mt-0.5">
                        ${order.totalPrice.toLocaleString()}
                      </span>
                    </div>

                    {/* ACTION BUTTON */}
                    <div className="flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/orders/${order._id}`);
                        }}
                        className="group flex items-center gap-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 text-xs font-bold text-cyan-400 transition-all duration-300 hover:bg-cyan-500 hover:text-slate-950 hover:border-transparent hover:shadow-lg hover:shadow-cyan-500/10"
                      >
                        <MessageSquare className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                        Audit Dispute
                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </button>
                    </div>

                    {/* RENTAL STATE STATUS */}
                    <div className="flex justify-center">
                      <span className={`inline-flex rounded-xl px-3.5 py-1.5 text-xs font-bold ${getStatusBadge(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    {/* ORDER DATE */}
                    <div className="flex items-center justify-end gap-1.5 text-slate-400 text-xs font-semibold text-right">
                      <Calendar className="h-3.5 w-3.5 text-slate-600" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
