import { ChevronRight, Search, Clock, CheckCircle2, TrendingUp, ShoppingBag, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { OrderCard } from "../components/OrderCard";
import { useTheme } from "../../settings/hooks/useTheme";
import { useI18n } from "../../shared/context/LanguageContext";
import { useAuth } from "../../auth/hooks/useAuth";
import OrdersFilterTabs from "../components/OrdersFilterTabs";
import { apiClient } from "../../../../lib/api/apiClient";

export function OrdersPage() {
  const { theme } = useTheme();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [filterMode, setFilterMode] = useState<'all' | 'renter' | 'owner'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isShowVnd = lang === "vi";

  useEffect(() => {
    async function fetchOrders() {
      if (!isAuthenticated) {
        setOrders([]);
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const response = await apiClient.get("/api/v1/orders");
        const mapped = response.data.data.map((ord: any) => ({
          id: ord.orderCode || ord._id,
          _id: ord._id,
          productId: ord.productId?._id || ord.productId || "",
          productName: ord.productName,
          customerName: ord.customerName,
          startDate: new Date(ord.startDate).toLocaleDateString("vi-VN"),
          endDate: new Date(ord.endDate).toLocaleDateString("vi-VN"),
          rawStartDate: ord.startDate,
          rawEndDate: ord.endDate,
          totalPrice: ord.totalPrice,
          status: ord.status,
          imageUrl: ord.productId?.imageUrl || ord.productId?.image || ord.imageUrl || "",
          image: "🛒",
          ownerId: ord.ownerId?._id || ord.ownerId,
          renterId: ord.renterId?._id || ord.renterId,
        }));
        setOrders(mapped);
      } catch (err) {
        console.error("Failed to fetch real orders:", err);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, [isAuthenticated]);

  // Filter based on renter vs owner role
  const roleFilteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!user) return true; 
      if (filterMode === "renter") return String(o.renterId) === String(user.id);
      if (filterMode === "owner") return String(o.ownerId) === String(user.id);
      return true; // "all"
    });
  }, [orders, filterMode, user]);

  // Filter based on search and status
  const displayedOrders = useMemo(() => {
    return roleFilteredOrders.filter((o) => {
      // 1. Status filter
      if (statusFilter !== "all" && o.status !== statusFilter) {
        return false;
      }
      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesProduct = o.productName?.toLowerCase().includes(query);
        const matchesId = o.id?.toLowerCase().includes(query);
        const matchesCustomer = o.customerName?.toLowerCase().includes(query);
        return matchesProduct || matchesId || matchesCustomer;
      }
      return true;
    });
  }, [roleFilteredOrders, statusFilter, searchQuery]);

  // Compute stats based on the role-filtered set of orders
  const stats = useMemo(() => {
    const active = roleFilteredOrders.filter(
      (item) =>
        item.status === "pending" ||
        item.status === "confirmed" ||
        item.status === "shipped",
    ).length;

    const completed = roleFilteredOrders.filter(
      (item) => item.status === "delivered",
    ).length;

    const totalValue = roleFilteredOrders.reduce((sum, o) => {
      if (o.status === "cancelled") return sum;
      const isDbV = o.totalPrice > 1000;
      const priceInV = isDbV ? o.totalPrice : o.totalPrice * 25000;
      const priceInU = isDbV ? o.totalPrice / 25000 : o.totalPrice;
      const actualPrice = isShowVnd ? priceInV : priceInU;
      return sum + actualPrice;
    }, 0);

    return { active, completed, totalValue };
  }, [roleFilteredOrders, isShowVnd]);

  // Count orders in each status for badge count bubbles
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: roleFilteredOrders.length,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    roleFilteredOrders.forEach((o) => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    });
    return counts;
  }, [roleFilteredOrders]);

  const formatPrice = (value: number) => {
    if (isShowVnd) {
      return value.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      });
    }
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const statusCategories = [
    { key: "all", label: lang === "vi" ? "Tất cả" : "All" },
    { key: "pending", label: lang === "vi" ? "Chờ duyệt" : "Pending" },
    { key: "confirmed", label: lang === "vi" ? "Đã duyệt" : "Confirmed" },
    { key: "shipped", label: lang === "vi" ? "Đang thuê" : "Renting" },
    { key: "delivered", label: lang === "vi" ? "Hoàn thành" : "Completed" },
    { key: "cancelled", label: lang === "vi" ? "Đã hủy" : "Cancelled" },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section with elegant modern styling */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-teal-500/10 via-amber-500/5 to-purple-500/10 p-6 md:p-8 border border-slate-200/50 dark:border-slate-800/40 shadow-xs">
        <div className="relative z-10">
          <h1
            className={`text-3xl font-extrabold tracking-tight ${theme === "dark" ? "text-slate-100" : "text-slate-900"
              }`}
          >
            {t.ordersTitle}
          </h1>
          <p
            className={`mt-2 text-sm md:text-base max-w-2xl ${theme === "dark" ? "text-slate-400" : "text-slate-600"
              }`}
          >
            {t.ordersDesc}
          </p>
        </div>
        <div className="absolute right-0 top-0 -mr-6 -mt-6 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute left-1/3 bottom-0 -mb-10 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Premium Dashboard Stats Grid */}
      <section className="grid gap-5 sm:grid-cols-3">
        {/* Stat 1: Active Orders */}
        <div
          className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${theme === "dark"
            ? "border-slate-800 bg-slate-900/60 ring-1 ring-white/5"
            : "border-slate-200 bg-white/70 backdrop-blur-md"
            }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-500"
                }`}
            >
              {t.ordersActive}
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400 transition-transform duration-300 group-hover:scale-110">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p
              className={`text-3xl font-black ${theme === "dark" ? "text-slate-100" : "text-slate-900"
                }`}
            >
              {stats.active}
            </p>
            <span className="text-xs text-slate-400 font-medium">đơn hàng</span>
          </div>
          <div className="absolute -bottom-4 -right-4 h-16 w-16 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors duration-300" />
        </div>

        {/* Stat 2: Completed Orders */}
        <div
          className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${theme === "dark"
            ? "border-slate-800 bg-slate-900/60 ring-1 ring-white/5"
            : "border-slate-200 bg-white/70 backdrop-blur-md"
            }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-500"
                }`}
            >
              {t.ordersDone}
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 transition-transform duration-300 group-hover:scale-110">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p
              className={`text-3xl font-black ${theme === "dark" ? "text-slate-100" : "text-slate-900"
                }`}
            >
              {stats.completed}
            </p>
            <span className="text-xs text-slate-400 font-medium">đơn hoàn tất</span>
          </div>
          <div className="absolute -bottom-4 -right-4 h-16 w-16 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors duration-300" />
        </div>

        {/* Stat 3: Total Transaction Value */}
        <div
          className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${theme === "dark"
            ? "border-slate-800 bg-slate-900/60 ring-1 ring-white/5"
            : "border-slate-200 bg-white/70 backdrop-blur-md"
            }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-500"
                }`}
            >
              {lang === "vi" ? "Giá trị giao dịch" : "Transaction Value"}
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 transition-transform duration-300 group-hover:scale-110">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-3">
            <p
              className={`text-2xl font-black text-teal-600 dark:text-teal-400 truncate`}
            >
              {formatPrice(stats.totalValue)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Không tính các đơn hàng đã bị hủy</p>
          </div>
          <div className="absolute -bottom-4 -right-4 h-16 w-16 bg-teal-500/5 rounded-full blur-xl group-hover:bg-teal-500/10 transition-colors duration-300" />
        </div>
      </section>

      {/* Search & Filter Unified Panel */}
      <div className={`rounded-3xl border p-4 shadow-xs space-y-4 ${theme === "dark"
        ? "border-slate-800 bg-slate-900/40"
        : "border-slate-200/90 bg-white/60 backdrop-blur-md"
        }`}>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Role Selection tabs */}
          <OrdersFilterTabs
            current={filterMode}
            onChange={(mode) => {
              setFilterMode(mode);
              setStatusFilter("all"); // reset status on role switch
            }}
            orders={orders}
            user={user}
          />

          {/* Right: Search Box */}
          <div className="relative w-full md:max-w-xs group">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "vi" ? "Tìm theo tên sản phẩm, mã đơn..." : "Search product, order code..."}
              className={`w-full rounded-2xl border pl-10 pr-9 py-2 text-sm outline-hidden transition-all duration-200 ${theme === "dark"
                ? "border-slate-700 bg-slate-800/50 text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:bg-slate-850"
                : "border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 focus:bg-slate-50/50"
                }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Status quick filters strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-t border-slate-100 dark:border-slate-800/80 pt-3">
          {statusCategories.map((cat) => {
            const isActive = statusFilter === cat.key;
            const count = statusCounts[cat.key] || 0;

            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setStatusFilter(cat.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${isActive
                  ? "bg-teal-500 text-white shadow-xs"
                  : theme === "dark"
                    ? "bg-slate-850 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-100"
                  }`}
              >
                <span>{cat.label}</span>
                <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] ${isActive
                  ? "bg-white/20 text-white"
                  : theme === "dark"
                    ? "bg-slate-700/80 text-slate-300"
                    : "bg-slate-200/80 text-slate-700"
                  }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List Container */}
      <section className="space-y-4">
        {/* Info/Hint alert banner */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {displayedOrders.length} {lang === "vi" ? "kết quả phù hợp" : "matching results"}
            </h2>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-amber-200/60 bg-amber-50 px-2.5 py-1 text-[10px] font-bold tracking-tight text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            {t.ordersQrHint}
          </span>
        </div>

        {isLoading ? (
          /* Premium animated skeletal loaders */
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className={`flex gap-5 rounded-2xl border p-5 shadow-xs ${theme === "dark" ? "border-slate-800 bg-slate-900/60" : "border-slate-200/90 bg-white"
                  } animate-pulse`}
              >
                <div className="h-24 w-24 shrink-0 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 w-1/3 rounded-sm bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-1/4 rounded-sm bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-1/2 rounded-sm bg-slate-200 dark:bg-slate-800" />
                  <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedOrders.length > 0 ? (
          displayedOrders.map((order) => {
            const image = order.imageUrl || "";
            const navigationId = order._id || order.id;
            return (
              <div
                key={order.id}
                className="group relative transition-all duration-300"
              >
                <OrderCard
                  order={order}
                  imageUrl={image}
                  onClick={() =>
                    navigate(`/orders/${encodeURIComponent(navigationId)}`)
                  }
                />
                
                {/* Visual hover-indicator detail link trigger */}
                <div className="absolute right-6 bottom-4 z-10 pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hidden md:block">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400">
                    {t.ordersViewDetail}
                    <ChevronRight size={14} className="animate-bounce-horizontal" />
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          /* Premium interactive Empty State design */
          <div className={`text-center py-16 px-6 rounded-3xl border border-dashed flex flex-col items-center justify-center ${theme === "dark"
            ? "border-slate-850 bg-slate-900/20"
            : "border-slate-250 bg-slate-50/50"
            }`}>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 text-3xl mb-4">
              <ShoppingBag className="h-8 w-8 stroke-1.5" />
            </div>
            <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">
              {lang === "vi" ? "Không có đơn hàng" : "No orders found"}
            </h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm leading-relaxed">
              {lang === "vi"
                ? "Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm của bạn để tìm kiếm đơn hàng khác."
                : "Try changing your status filter or search keyword to find other orders."}
            </p>
            <button
              onClick={() => {
                setStatusFilter("all");
                setSearchQuery("");
                setFilterMode("all");
                navigate("/");
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer"
            >
              {lang === "vi" ? "Khám phá sản phẩm" : "Explore Products"}
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
