import { Shield } from "lucide-react";

interface Props {
  users: {
    trustScore?: number;
  }[];
}

export function TrustChart({ users }: Props) {
  const trust100 = users.filter(
    (user) => (user.trustScore || 100) === 100,
  ).length;

  const trust60 = users.filter((user) => user.trustScore === 60).length;
  const trust40 = users.filter((user) => user.trustScore === 40).length;
  const trust10 = users.filter((user) => user.trustScore === 10).length;

  const total = trust100 + trust60 + trust40 + trust10;

  const green = total > 0 ? (trust100 / total) * 100 : 0;
  const yellow = total > 0 ? (trust60 / total) * 100 : 0;
  const orange = total > 0 ? (trust40 / total) * 100 : 0;

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-4.5 w-4.5 text-cyan-400" />
          <p className="text-sm font-bold text-slate-300">Độ Tín Nhiệm Hệ Thống</p>
        </div>

        {/* DONUT VISUALIZATION */}
        <div className="flex justify-center my-6">
          <div className="relative flex h-48 w-48 items-center justify-center rounded-full shadow-2xl shadow-cyan-950/20">
            {/* Outer Conic-Gradient Ring */}
            <div
              className="absolute inset-0 rounded-full transition-all duration-500"
              style={{
                background: `conic-gradient(
                  #0df2c9 0% ${green}%,
                  #eab308 ${green}% ${green + yellow}%,
                  #f97316 ${green + yellow}% ${green + yellow + orange}%,
                  #f43f5e ${green + yellow + orange}% 100%
                )`,
              }}
            />
            {/* Glassmorphic Inner Circle */}
            <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-[#0a0f1d] border border-slate-800 shadow-inner">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tài khoản</span>
              <span className="text-3xl font-extrabold tracking-tight text-white mt-0.5">{total}</span>
              <span className="text-[10px] font-bold text-teal-400 mt-1 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
                Audited
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED LEGEND LABELS */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {/* EXCELLENT (100) */}
        <div className="group rounded-xl border border-slate-800/40 bg-slate-900/10 p-3 hover:bg-slate-900/40 transition duration-200">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0df2c9] shadow-lg shadow-[#0df2c9]/40" />
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 transition duration-150">Tuyệt đối</span>
          </div>
          <p className="mt-1 text-base font-extrabold text-white">
            100% <span className="text-xs font-semibold text-slate-500">({trust100})</span>
          </p>
        </div>

        {/* GOOD (60) */}
        <div className="group rounded-xl border border-slate-800/40 bg-slate-900/10 p-3 hover:bg-slate-900/40 transition duration-200">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/40" />
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 transition duration-150">Khá tốt</span>
          </div>
          <p className="mt-1 text-base font-extrabold text-white">
            60% <span className="text-xs font-semibold text-slate-500">({trust60})</span>
          </p>
        </div>

        {/* AVERAGE (40) */}
        <div className="group rounded-xl border border-slate-800/40 bg-slate-900/10 p-3 hover:bg-slate-900/40 transition duration-200">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#f97316] shadow-lg shadow-[#f97316]/40" />
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 transition duration-150">Trung bình</span>
          </div>
          <p className="mt-1 text-base font-extrabold text-white">
            40% <span className="text-xs font-semibold text-slate-500">({trust40})</span>
          </p>
        </div>

        {/* CRITICAL (10) */}
        <div className="group rounded-xl border border-slate-800/40 bg-slate-900/10 p-3 hover:bg-slate-900/40 transition duration-200">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#f43f5e] shadow-lg shadow-[#f43f5e]/40" />
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 transition duration-150">Cảnh báo</span>
          </div>
          <p className="mt-1 text-base font-extrabold text-white">
            10% <span className="text-xs font-semibold text-slate-500">({trust10})</span>
          </p>
        </div>
      </div>
    </div>
  );
}
