import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface Props {
  children: ReactNode;
}

export function AdminLayout({ children }: Props) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const navItem = (label: string, path: string) => (
    <button
      onClick={() => navigate(path)}
      className={`w-full text-left px-4 py-3 rounded-xl transition-all text-sm font-medium ${
        isActive(path)
          ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
          : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-[#020617] text-white">
      <aside className="w-64 border-r border-slate-800 bg-[#020617] p-5 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg">
            <img src="/urent.png" alt="logo" className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-bold text-white">U-Rent</p>

            <p className="text-[10px] uppercase text-slate-400 tracking-[0.3em]">
              ADMIN
            </p>
          </div>
        </div>
        <nav className="flex flex-col gap-2">
          {navItem("Dashboard", "/admin")}
          {navItem("Users", "/admin/users")}
          {navItem("Orders", "/admin/orders")}
          {navItem("Logs", "/admin/logs")}
        </nav>
        <div className="mt-auto pt-6 text-xs text-slate-500">
          © U-Rent Admin
        </div>
      </aside>
      <main className="flex-1 p-8 bg-gradient-to-br from-[#020617] to-slate-900 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
