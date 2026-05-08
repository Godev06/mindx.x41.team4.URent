import { useEffect, useState } from "react";
import { AdminLayout } from "../layout/AdminLayout";
import { TrustChart } from "../components/TrustChart";

interface User {
  _id: string;
  trustScore?: number;
}

export function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch("http://localhost:5003/api/v1/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.log(err));
  }, []);
  const totalUsers = users.length;

  const onlineUsers = Math.floor(totalUsers * 0.7);

  const offlineUsers = totalUsers - onlineUsers;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-gradient-to-r from-teal-600/80 to-cyan-600/60 p-6 shadow-lg">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Welcome back, Admin 👋
            </h2>

            <p className="mt-2 text-sm text-white/80">
              You have 12 new orders and {onlineUsers} users online today
            </p>
          </div>

          <button className="rounded-xl bg-white/10 px-5 py-3 text-sm text-white backdrop-blur transition hover:bg-white/20">
            View Analytics →
          </button>
        </div>
        <div className="grid grid-cols-3 gap-5">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 transition hover:scale-[1.02] hover:border-teal-500/40">
            <p className="text-sm text-slate-400">Users</p>

            <p className="mt-2 text-4xl font-bold text-white">{totalUsers}</p>

            <div className="mt-4 space-y-1 text-sm">
              <p className="text-teal-400">● Online: {onlineUsers}</p>

              <p className="text-slate-500">● Offline: {offlineUsers}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 transition hover:scale-[1.02] hover:border-yellow-500/40">
            <p className="text-sm text-slate-400">Orders</p>

            <p className="mt-2 text-4xl font-bold text-white">340</p>

            <div className="mt-4 space-y-1 text-sm">
              <p className="text-yellow-400">⏳ Pending: 40</p>

              <p className="text-teal-400">✔ Done: 250</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 transition hover:scale-[1.02] hover:border-red-500/40">
            <p className="text-sm text-slate-400">Items</p>

            <p className="mt-2 text-4xl font-bold text-white">89</p>

            <div className="mt-4 space-y-1 text-sm">
              <p className="text-teal-400">● In Stock: 60</p>

              <p className="text-red-400">● Out Stock: 9</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* TRUST CHART */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-lg">
            <TrustChart users={users} />
          </div>

          <div className="col-span-2 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-lg">
            {/* HEADER */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-slate-400">Recent Activity</p>

              <button className="text-sm text-teal-400 hover:underline">
                View all
              </button>
            </div>

            <div className="space-y-4">
              {/* ITEM */}
              <div className="flex items-center justify-between rounded-xl px-3 py-3 transition hover:bg-slate-800/40">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
                    👤
                  </div>

                  <div>
                    <p className="text-sm text-white">New user registered</p>

                    <p className="text-xs text-slate-500">2 min ago</p>
                  </div>
                </div>

                <span className="text-xs text-slate-500">just now</span>
              </div>

              {/* ITEM */}
              <div className="flex items-center justify-between rounded-xl px-3 py-3 transition hover:bg-slate-800/40">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
                    ✔
                  </div>

                  <div>
                    <p className="text-sm text-white">Order #102 completed</p>

                    <p className="text-xs text-slate-500">Payment received</p>
                  </div>
                </div>

                <span className="rounded-lg bg-teal-500/10 px-3 py-1 text-xs text-teal-400">
                  Done
                </span>
              </div>

              {/* ITEM */}
              <div className="flex items-center justify-between rounded-xl px-3 py-3 transition hover:bg-slate-800/40">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                    ⚠
                  </div>

                  <div>
                    <p className="text-sm text-white">User blocked</p>

                    <p className="text-xs text-slate-500">
                      Suspicious activity
                    </p>
                  </div>
                </div>

                <span className="rounded-lg bg-red-500/10 px-3 py-1 text-xs text-red-400">
                  Action
                </span>
              </div>

              {/* ITEM */}
              <div className="flex items-center justify-between rounded-xl px-3 py-3 transition hover:bg-slate-800/40">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400">
                    ⏳
                  </div>

                  <div>
                    <p className="text-sm text-white">Inventory updated</p>

                    <p className="text-xs text-slate-500">Waiting sync</p>
                  </div>
                </div>

                <span className="rounded-lg bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400">
                  Pending
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
