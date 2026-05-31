import { useEffect, useState } from "react";
import { AdminLayout } from "../layout/AdminLayout";
import { TrustChart } from "../components/TrustChart";
import { apiClient } from "../../../lib/api/apiClient";
import {
  Users as UsersIcon,
  ShoppingBag,
  Box,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

interface User {
  _id: string;
  trustScore?: number;
  role?: "admin" | "user";
}

export function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<{
    totalUsers: number;
    onlineUsers: number;
    offlineUsers: number;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalInventory: number;
    rentedCount: number;
    overdueCount: number;
    recentActivities: any[];
  }>({
    totalUsers: 0,
    onlineUsers: 0,
    offlineUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalInventory: 0,
    rentedCount: 0,
    overdueCount: 0,
    recentActivities: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiClient.get("/api/v1/admin/dashboard-stats")
      .then((res) => {
        if (res.data && res.data.success) {
          setStats(res.data.data);
          setUsers(res.data.data.users || []);
        }
      })
      .catch((err) => console.error("Failed to load dashboard stats:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const totalUsers = stats.totalUsers;
  const onlineUsers = stats.onlineUsers;
  const offlineUsers = stats.offlineUsers;

  return (
    <AdminLayout>
      <div className="space-y-10">
        {/* HERO GREETING BANNER */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-[#0d1f33] via-[#0b2b3a] to-[#070b19] p-8 shadow-2xl shadow-cyan-950/10">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 -mb-10 h-64 w-64 rounded-full bg-teal-500/5 blur-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Welcome back, Admin 👋
              </h2>
              <p className="max-w-xl text-sm font-medium text-slate-300 leading-relaxed">
                Your platform is running smoothly. You have <span className="font-bold text-cyan-400">{stats.pendingOrders} new orders</span> pending verification, and <span className="font-bold text-teal-400">{onlineUsers} users online</span> right now.
              </p>
            </div>

            <button className="flex items-center justify-center gap-2 self-start rounded-2xl bg-cyan-500 px-6 py-3.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-400 hover:shadow-cyan-400/30 active:translate-y-0">
              View Analytics
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* METRICS STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* STAT 1: USERS */}
          <div className="relative group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-teal-500/30 hover:bg-slate-900/60 shadow-lg shadow-slate-950/20">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-teal-500/5 transition duration-300 group-hover:bg-teal-500/10" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Users</span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 transition-transform duration-300 group-hover:scale-110">
                <UsersIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-4xl font-extrabold tracking-tight text-white">{totalUsers}</h3>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-teal-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
                  Active: {onlineUsers}
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                  Offline: {offlineUsers}
                </span>
              </div>
            </div>
          </div>

          {/* STAT 2: ORDERS */}
          <div className="relative group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-yellow-500/30 hover:bg-slate-900/60 shadow-lg shadow-slate-950/20">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-yellow-500/5 transition duration-300 group-hover:bg-yellow-500/10" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Orders Managed</span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 transition-transform duration-300 group-hover:scale-110">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-4xl font-extrabold tracking-tight text-white">{stats.totalOrders}</h3>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-yellow-400">
                  <Clock className="h-3.5 w-3.5" />
                  Pending: {stats.pendingOrders}
                </span>
                <span className="flex items-center gap-1.5 text-teal-400">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Completed: {stats.completedOrders}
                </span>
              </div>
            </div>
          </div>

          {/* STAT 3: INVENTORY ITEMS */}
          <div className="relative group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-cyan-500/30 hover:bg-slate-900/60 shadow-lg shadow-slate-950/20">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-cyan-500/5 transition duration-300 group-hover:bg-cyan-500/10" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Inventory Items</span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 transition-transform duration-300 group-hover:scale-110">
                <Box className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-4xl font-extrabold tracking-tight text-white">{stats.totalInventory}</h3>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Rented: {stats.rentedCount}
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Overdue: {stats.overdueCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM CHARTS AND ACTIVITIES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TRUST GRAPH DONUT */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-md shadow-lg shadow-slate-950/20">
            <TrustChart users={users} />
          </div>

          {/* RECENT ACTIONS MONITOR */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-md shadow-lg shadow-slate-950/20">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Recent Activities</h3>
                <p className="text-xs font-medium text-slate-500 mt-1">Platform actions tracked recently</p>
              </div>

              <button className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition duration-150">
                View all activities
              </button>
            </div>

            <div className="space-y-3.5">
              {isLoading ? (
                <div className="text-center py-8 text-xs text-slate-500">Loading activities...</div>
              ) : stats.recentActivities.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">No platform actions recorded yet.</div>
              ) : (
                stats.recentActivities.slice(0, 5).map((act: any) => {
                  const actorName = act.userId?.displayName || act.userId?.username || act.actor || "System";
                  const timeAgo = new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " " + new Date(act.timestamp).toLocaleDateString();
                  
                  return (
                    <div key={act._id} className="flex items-center justify-between rounded-xl border border-slate-800/40 bg-slate-900/10 p-3.5 hover:bg-slate-900/40 transition duration-300">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          <Box className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{act.action}</p>
                          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{act.description} (by {actorName})</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 shrink-0">{timeAgo}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
