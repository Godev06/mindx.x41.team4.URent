import { useEffect, useState } from "react";

import { AdminLayout } from "../layout/AdminLayout";

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

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:5003/api/v1/users");

      const data = await response.json();

      setUsers(data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Users Management</h1>

            <p className="mt-2 text-slate-400">Manage all platform users</p>
          </div>

          <input
            placeholder="Search user..."
            className="rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-5">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-slate-400">Total Users</p>

            <h2 className="mt-3 text-5xl font-bold text-white">
              {users.length.toLocaleString()}
            </h2>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-slate-400">Online</p>

            <h2 className="mt-3 text-5xl font-bold text-teal-400">
              {Math.floor(users.length * 0.7).toLocaleString()}
            </h2>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-slate-400">Offline</p>

            <h2 className="mt-3 text-5xl font-bold text-slate-400">
              {Math.floor(users.length * 0.3).toLocaleString()}
            </h2>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80">
          <div className="grid grid-cols-6 border-b border-slate-800 bg-slate-800/50 px-6 py-4 text-sm uppercase tracking-wide text-slate-400">
            <p>User</p>

            <p>Độ tín nhiệm</p>

            <p>Email</p>

            <p>Chức vụ</p>

            <p>Status</p>

            <p>Joined</p>
          </div>

          <div>
            {users.map((user, index) => {
              const trust = user.trustScore || 100;

              const emailName = user.email?.split("@")[0];

              const mainName =
                user.username || user.displayName || emailName || "User";

              const subName = user.displayName
                ? `@${user.displayName}`
                : `@${emailName}`;

              return (
                <div
                  key={user._id}
                  className="grid grid-cols-6 items-center border-b border-slate-800 px-6 py-5 transition hover:bg-slate-800/20"
                >
                  {/* USER */}
                  <div className="flex flex-col">
                    <p className="font-semibold text-white">{mainName}</p>

                    <p className="text-sm text-slate-500">{subName}</p>
                  </div>

                  {/* TRUST */}
                  <div>
                    <select
                      value={trust}
                      onChange={async (e) => {
                        const newTrust = Number(e.target.value);

                        try {
                          const response = await fetch(
                            `http://localhost:5003/api/v1/users/${user._id}/trust`,
                            {
                              method: "PATCH",

                              headers: {
                                "Content-Type": "application/json",
                              },

                              body: JSON.stringify({
                                trustScore: newTrust,
                              }),
                            },
                          );

                          const updatedUser = await response.json();

                          setUsers((prev) =>
                            prev.map((u) =>
                              u._id === user._id
                                ? {
                                    ...u,
                                    trustScore: updatedUser.trustScore,
                                  }
                                : u,
                            ),
                          );
                        } catch (error) {
                          console.log(error);
                        }
                      }}
                      className={`rounded-lg px-3 py-2 text-sm font-medium outline-none cursor-pointer ${
                        trust === 100
                          ? "bg-teal-500/10 text-teal-400"
                          : trust === 60
                            ? "bg-yellow-500/10 text-yellow-400"
                            : trust === 40
                              ? "bg-orange-500/10 text-orange-400"
                              : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      <option value={100}>100%</option>

                      <option value={60}>60%</option>

                      <option value={40}>40%</option>

                      <option value={10}>10%</option>
                    </select>
                  </div>

                  {/* EMAIL */}
                  <p className="truncate text-white">{user.email}</p>

                  {/* ROLE */}
                  <div>
                    <select
                      value={user.role || "user"}
                      onChange={async (e) => {
                        const newRole = e.target.value as "admin" | "user";

                        try {
                          const response = await fetch(
                            `http://localhost:5003/api/v1/users/${user._id}/role`,
                            {
                              method: "PATCH",

                              headers: {
                                "Content-Type": "application/json",
                              },

                              body: JSON.stringify({
                                role: newRole,
                              }),
                            },
                          );

                          const updatedUser = await response.json();

                          setUsers((prev) =>
                            prev.map((u) =>
                              u._id === user._id
                                ? {
                                    ...u,
                                    role: updatedUser.role,
                                  }
                                : u,
                            ),
                          );
                        } catch (error) {
                          console.log(error);
                        }
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none cursor-pointer"
                    >
                      <option value="user">User</option>

                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* STATUS */}
                  <div>
                    <span
                      className={`rounded-lg px-3 py-1 text-sm ${
                        index % 2 === 0
                          ? "bg-teal-500/10 text-teal-400"
                          : "bg-slate-500/20 text-slate-300"
                      }`}
                    >
                      {index % 2 === 0 ? "Online" : "Offline"}
                    </span>
                  </div>

                  {/* DATE */}
                  <p className="text-slate-300">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
