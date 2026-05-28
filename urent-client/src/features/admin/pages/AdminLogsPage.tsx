import { useState } from "react";
import { AdminLayout } from "../layout/AdminLayout";
import { 
  Activity, 
  Terminal, 
  Download, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Compass,
  AlertOctagon,
  RefreshCw
} from "lucide-react";

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

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "High":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/25";
      case "Medium":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25";
      default:
        return "bg-teal-500/10 text-teal-400 border border-teal-500/25";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Critical":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/25";
      case "Warning":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25";
      default:
        return "bg-teal-500/10 text-teal-400 border border-teal-500/25";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-10">
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              System Logs Audit
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-400">
              Audit important background operations, user registrations, and potential security escalations
            </p>
          </div>

          <button className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-6 py-3.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-400 hover:shadow-cyan-400/30 active:translate-y-0">
            <Download className="h-4.5 w-4.5" />
            Export Audit Logs
          </button>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* TOTAL */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-lg shadow-slate-950/10">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Entries</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white">{logs.length}</h2>
          </div>

          {/* CRITICAL */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-lg shadow-slate-950/10">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Critical Incidents</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-rose-400">
              {logs.filter((log) => log.status === "Critical").length}
            </h2>
          </div>

          {/* WARNINGS */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-lg shadow-slate-950/10">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">System Warnings</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-yellow-400">
              {logs.filter((log) => log.status === "Warning").length}
            </h2>
          </div>

          {/* SUCCESS */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-lg shadow-slate-950/10">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Successful Events</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-teal-400">
              {logs.filter((log) => log.status === "Success").length}
            </h2>
          </div>
        </div>

        {/* LOGS TABLE IDE/TERMINAL CONSOLE STYLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/20 backdrop-blur-md shadow-xl shadow-slate-950/25">
          {/* CONSOLE HEADER */}
          <div className="flex items-center gap-2 border-b border-slate-850 bg-slate-950/60 px-6 py-4">
            <Terminal className="h-4.5 w-4.5 text-cyan-400" />
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Audit_Terminal_Session.log</p>
          </div>

          {/* GRID HEADERS */}
          <div className="grid grid-cols-6 border-b border-slate-850 bg-slate-950/30 px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            <p>Reference / Actor</p>
            <p>Action Type</p>
            <p className="col-span-2">Logged details</p>
            <p className="text-center">Severity</p>
            <p className="text-right">Timestamp</p>
          </div>

          {/* GRID DATA */}
          <div className="divide-y divide-slate-850 font-mono">
            {logs.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-6 items-center px-6 py-5.5 transition duration-300 hover:bg-slate-900/40 group text-xs"
              >
                {/* ID & ACTOR */}
                <div className="pr-4">
                  <p className="font-extrabold text-cyan-400 tracking-wider">#{log.id}</p>
                  <p className="text-[10px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">{log.actor}</p>
                </div>

                {/* ACTION TYPE */}
                <div>
                  <p className="font-bold text-slate-300">{log.action}</p>
                </div>

                {/* DESCRIPTION */}
                <div className="col-span-2 pr-6">
                  <p className="text-slate-400 font-medium leading-relaxed max-w-lg">
                    {log.description}
                  </p>
                </div>

                {/* SEVERITY LEVEL Badge */}
                <div className="flex justify-center gap-1.5">
                  <span className={`inline-flex rounded-xl px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getLevelBadge(log.level)}`}>
                    {log.level}
                  </span>
                </div>

                {/* TIMESTAMP */}
                <div className="flex items-center justify-end gap-1.5 text-slate-500 text-[10px] font-bold text-right">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-slate-700" />
                  <span>{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM MONITOR CONTROL PANEL */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-lg shadow-slate-950/10">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
            <Activity className="h-4.5 w-4.5 text-cyan-400" />
            Security Shield Monitor active
          </h3>
          
          <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-2xl">
             Escrow security triggers automatically listen to administrator roles, renter trust mutations, escort code scans, checkout validations, and suspicious network headers. Use the filter controls below to parse the stack.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold">
            <button className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/25 px-4.5 py-2.5 text-rose-400 hover:bg-rose-500/20 transition duration-150">
              <ShieldAlert className="h-4 w-4" />
              Critical Events only
            </button>

            <button className="flex items-center gap-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/25 px-4.5 py-2.5 text-yellow-400 hover:bg-yellow-500/20 transition duration-150">
              <AlertOctagon className="h-4 w-4" />
              Audits Warnings
            </button>

            <button className="flex items-center gap-1.5 rounded-xl bg-teal-500/10 border border-teal-500/25 px-4.5 py-2.5 text-teal-400 hover:bg-teal-500/20 transition duration-150">
              <RefreshCw className="h-4 w-4 shrink-0 transition-transform hover:rotate-180 duration-500" />
              Refresh Audited Logs
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
