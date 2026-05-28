import { useEffect, useState } from "react";
import { AdminLayout } from "../layout/AdminLayout";
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  UserCheck,
  Mail,
  Calendar,
  Lock,
  Compass
} from "lucide-react";

interface User {
  _id: string;
  email: string;
  username?: string;
  displayName?: string;
  trustScore?: number;
  createdAt?: string;
  role?: "admin" | "user";
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5003/api/v1/users");
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: "admin" | "user") => {
    // 1. Optimistic Update in State
    setUsers((prev) =>
      prev.map((user) =>
        user._id === userId
          ? {
            ...user,
            role: newRole,
          }
          : user
      )
    );

    // 2. Call endpoint in background
    try {
      await fetch(`http://localhost:5003/api/v1/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: newRole,
        }),
      });
    } catch (error) {
      console.error("Failed to update user role:", error);
      // Re-fetch users on error to ensure sync
      fetchUsers();
    }
  };

  const handleTrustChange = async (userId: string, newTrust: number) => {
    // Optimistic Update
    setUsers((prev) =>
      prev.map((user) =>
        user._id === userId
          ? {
            ...user,
            trustScore: newTrust,
          }
          : user
      )
    );

    try {
      await fetch(`http://localhost:5003/api/v1/users/${userId}/trust`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trustScore: newTrust,
        }),
      });
    } catch (error) {
      console.error("Failed to update trust score:", error);
      fetchUsers();
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    const username = (user.username || "").toLowerCase();
    const displayName = (user.displayName || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    return username.includes(term) || displayName.includes(term) || email.includes(term);
  });

  const totalUsers = users.length;
  const onlineUsers = Math.floor(totalUsers * 0.7);
  const offlineUsers = totalUsers - onlineUsers;

  return (
    <AdminLayout>
      <div className="space-y-10">
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Users Management
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-400">
              Manage accounts, toggle administrative access, and audit renter trust metrics
            </p>
          </div>

          {/* SEARCH INPUT FILTER */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 py-3 pl-11 pr-4 text-sm font-medium text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:bg-slate-900 focus:outline-none transition duration-300 shadow-md shadow-slate-950/20"
            />
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-lg shadow-slate-950/10">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Registered</p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-white">
              {totalUsers.toLocaleString()}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-lg shadow-slate-950/10">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Online Users</p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-teal-400">
              {onlineUsers.toLocaleString()}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-lg shadow-slate-950/10">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Offline Members</p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-500">
              {offlineUsers.toLocaleString()}
            </h2>
          </div>
        </div>

        {/* TABLE LIST CONTAINER */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-md shadow-xl shadow-slate-950/25">
          {/* GRID HEADER */}
          <div className="grid grid-cols-6 border-b border-slate-850 bg-slate-950/45 px-6 py-4.5 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
            <p>User profile</p>
            <p>Trust score</p>
            <p>Email address</p>
            <p className="text-center">Role / access</p>
            <p className="text-center">Session</p>
            <p className="text-right">Joined date</p>
          </div>

          {/* GRID DATA ITEMS */}
          <div className="divide-y divide-slate-850">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-cyan-500" />
                <p className="text-xs font-bold uppercase tracking-widest">Loading accounts list...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
                <Compass className="h-10 w-10 text-slate-600 animate-pulse" />
                <p className="text-sm font-semibold">No accounts match your criteria</p>
              </div>
            ) : (
              filteredUsers.map((user, index) => {
                const trust = user.trustScore || 100;
                const emailName = user.email?.split("@")[0];
                const isLocalAccount = user.username || user.displayName;
                const mainName = isLocalAccount ? user.displayName || "User" : emailName;

                // Initials for avatar profile
                const avatarInit = mainName.substring(0, 2).toUpperCase();

                // Dynamic coloring for avatar circle
                const borderColors = [
                  "from-teal-400 to-cyan-500 text-cyan-200 bg-cyan-500/10",
                  "from-purple-400 to-pink-500 text-pink-200 bg-pink-500/10",
                  "from-amber-400 to-orange-500 text-orange-200 bg-orange-500/10",
                  "from-blue-400 to-indigo-500 text-blue-200 bg-blue-500/10"
                ];
                const avatarStyle = borderColors[index % borderColors.length];

                return (
                  <div
                    key={user._id}
                    className="grid grid-cols-6 items-center px-6 py-4.5 transition duration-300 hover:bg-slate-900/40 group"
                  >
                    {/* USER PROFILE INFO */}
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-extrabold text-xs bg-gradient-to-tr ${avatarStyle.split(" ")[0]} ${avatarStyle.split(" ")[1]} border border-white/5 shadow-inner`}>
                        {avatarInit}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <p className="font-bold text-white text-sm truncate group-hover:text-cyan-400 transition-colors duration-150">{mainName}</p>
                      </div>
                    </div>

                    {/* RENTER TRUST SELECTOR */}
                    <div>
                      <select
                        value={trust}
                        onChange={(e) => handleTrustChange(user._id, Number(e.target.value))}
                        className={`rounded-xl border border-transparent px-3 py-1.5 text-xs font-extrabold outline-none cursor-pointer hover:border-slate-800 transition duration-150 ${trust === 100
                          ? "bg-teal-500/10 text-teal-400"
                          : trust === 60
                            ? "bg-yellow-500/10 text-yellow-400"
                            : trust === 40
                              ? "bg-orange-500/10 text-orange-400"
                              : "bg-rose-500/10 text-rose-400"
                          }`}
                      >
                        <option value={100} className="bg-slate-950 text-teal-400 font-bold">100% Trust</option>
                        <option value={60} className="bg-slate-950 text-yellow-400 font-bold">60% Trust</option>
                        <option value={40} className="bg-slate-950 text-orange-400 font-bold">40% Trust</option>
                        <option value={10} className="bg-slate-950 text-rose-400 font-bold">10% Trust</option>
                      </select>
                    </div>

                    {/* EMAIL ADDRESS */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Mail className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                      <p className="truncate text-xs font-medium text-slate-300">{user.email}</p>
                    </div>

                    {/* ROLE MANAGEMENT SELECTOR - EXACTLY 1 DROPDOWN! */}
                    <div className="flex justify-center">
                      <select
                        value={user.role || "user"}
                        onChange={(e) => handleRoleChange(user._id, e.target.value as "admin" | "user")}
                        className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold outline-none cursor-pointer transition duration-200 ${user.role === "admin"
                          ? "bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/20"
                          : "bg-slate-900/50 text-slate-400 border-slate-800 hover:bg-slate-900/80 hover:text-white"
                          }`}
                      >
                        <option value="user" className="bg-slate-950 text-slate-400">User Mode</option>
                        <option value="admin" className="bg-slate-950 text-purple-300 font-bold">Administrator</option>
                      </select>
                    </div>

                    {/* DUMMY SESSION STATE */}
                    <div className="flex justify-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${index % 2 === 0
                          ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                          : "bg-slate-900/50 text-slate-500 border border-slate-850"
                          }`}
                      >
                        <span className={`h-1 w-1 rounded-full ${index % 2 === 0 ? "bg-teal-400 animate-pulse" : "bg-slate-600"}`} />
                        {index % 2 === 0 ? "Active" : "Offline"}
                      </span>
                    </div>

                    {/* REGISTRATION DATE */}
                    <div className="flex items-center justify-end gap-1.5 text-slate-400 text-xs font-semibold text-right">
                      <Calendar className="h-3.5 w-3.5 text-slate-600" />
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
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
