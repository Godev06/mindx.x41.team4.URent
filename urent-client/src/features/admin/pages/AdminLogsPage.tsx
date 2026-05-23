import { useState } from "react";

import { AdminLayout } from "../layout/AdminLayout";

interface LogItem {
  id: string;
  action: string;
  description: string;
  level: "Low" | "Medium" | "High";
  actor: string;
  status: "Success" | "Warning" | "Critical";
  time: string;
}

export function AdminLogsPage() {
  const [logs] = useState<LogItem[]>([
    {
      id: "MXTU-56",
      action: "System Activity",
      description:
        "Admin changed trust score of renter Nguyễn Trọng Tiến from 100% to 60%.",
      level: "Medium",
      actor: "Zas Gamez",
      status: "Success",
      time: "2 min ago",
    },
    {
      id: "MXTU-57",
      action: "Rental Dispute",
      description:
        "User reported suspicious rental behavior during camera return process.",
      level: "High",
      actor: "Admin",
      status: "Critical",
      time: "10 min ago",
    },
    {
      id: "MXTU-58",
      action: "Login Attempt",
      description:
        "Multiple failed login attempts detected from unknown IP address.",
      level: "High",
      actor: "Security",
      status: "Warning",
      time: "15 min ago",
    },
    {
      id: "MXTU-59",
      action: "Inventory Update",
      description:
        "Macbook Pro inventory status updated from rented to available.",
      level: "Low",
      actor: "Kho hàng",
      status: "Success",
      time: "30 min ago",
    },
    {
      id: "MXTU-60",
      action: "QR Verification",
      description:
        "Rental QR code scanned successfully during pickup confirmation.",
      level: "Low",
      actor: "System",
      status: "Success",
      time: "1 hour ago",
    },
  ]);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-white">System Logs</h1>

            <p className="mt-3 text-lg text-slate-400">
              Track important activities and suspicious behaviors
            </p>
          </div>

          <button className="rounded-2xl bg-cyan-500/10 px-6 py-4 font-medium text-cyan-400 transition hover:bg-cyan-500/20">
            Export Logs
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-4 gap-5">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-slate-400">Total Logs</p>

            <h2 className="mt-3 text-5xl font-bold text-white">
              {logs.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-slate-400">Critical</p>

            <h2 className="mt-3 text-5xl font-bold text-red-400">
              {logs.filter((log) => log.status === "Critical").length}
            </h2>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-slate-400">Warnings</p>

            <h2 className="mt-3 text-5xl font-bold text-yellow-400">
              {logs.filter((log) => log.status === "Warning").length}
            </h2>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-slate-400">Success</p>

            <h2 className="mt-3 text-5xl font-bold text-teal-400">
              {logs.filter((log) => log.status === "Success").length}
            </h2>
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80">
          <div className="grid grid-cols-6 border-b border-slate-800 bg-slate-800/40 px-6 py-5 text-sm uppercase tracking-wide text-slate-400">
            <p>Log ID</p>

            <p>Action</p>

            <p>Description</p>

            <p>Level</p>

            <p>Status</p>

            <p>Time</p>
          </div>
          <div>
            {logs.map((log) => (
              <div
                key={log.id}
                className="grid cursor-pointer grid-cols-6 items-center border-b border-slate-800 px-6 py-6 transition hover:bg-slate-800/30"
              >
                <div>
                  <p className="font-semibold text-cyan-400">{log.id}</p>

                  <p className="mt-1 text-sm text-slate-500">{log.actor}</p>
                </div>
                <div>
                  <p className="font-semibold text-white">{log.action}</p>
                </div>
                <div>
                  <p className="max-w-md text-sm leading-6 text-slate-300">
                    {log.description}
                  </p>
                </div>
                <div>
                  <span
                    className={`rounded-xl px-4 py-2 text-sm font-medium ${
                      log.level === "High"
                        ? "bg-red-500/10 text-red-400"
                        : log.level === "Medium"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-teal-500/10 text-teal-400"
                    }`}
                  >
                    {log.level}
                  </span>
                </div>
                <div>
                  <span
                    className={`rounded-xl px-4 py-2 text-sm font-medium ${
                      log.status === "Critical"
                        ? "bg-red-500/10 text-red-400"
                        : log.status === "Warning"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-teal-500/10 text-teal-400"
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
                <div>
                  <p className="text-slate-300">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-2xl font-bold text-white">Security Monitor</h2>

          <p className="mt-3 text-slate-400">
            Logs are automatically tracked for admin actions, rental disputes,
            trust score changes, QR activities, and suspicious system behaviors.
          </p>

          <div className="mt-6 flex gap-4">
            <button className="rounded-2xl bg-red-500/10 px-5 py-3 text-red-400 transition hover:bg-red-500/20">
              View Critical Logs
            </button>

            <button className="rounded-2xl bg-yellow-500/10 px-5 py-3 text-yellow-400 transition hover:bg-yellow-500/20">
              View Warnings
            </button>

            <button className="rounded-2xl bg-teal-500/10 px-5 py-3 text-teal-400 transition hover:bg-teal-500/20">
              Refresh Logs
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
