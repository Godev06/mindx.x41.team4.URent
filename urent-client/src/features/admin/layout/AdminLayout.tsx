import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../user/auth/hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Activity,
  LogOut,
  Home,
  Bell,
  Search,
  UserCheck,
  MessageSquare
} from "lucide-react";

interface Props {
  children: ReactNode;
}

export function AdminLayout({ children }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const adminName = user?.displayName || user?.username || "System Admin";
  const initials = adminName.substring(0, 2).toUpperCase();

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Users", path: "/admin/users", icon: Users },
    { label: "Orders", path: "/admin/orders", icon: ShoppingBag },
    { label: "Chat", path: "/admin/chat", icon: MessageSquare },
    { label: "Logs", path: "/admin/logs", icon: Activity },
  ];

  const handleLogout = () => {
    logout({ redirectTo: "/login" });
  };

  const navItem = (label: string, path: string) => {
    const item = menuItems.find((m) => m.path === path);
    const Icon = item ? item.icon : LayoutDashboard;
    const active = isActive(path);

    return (
      <button
        key={path}
        onClick={() => navigate(path)}
        className={`group flex w-full items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 border ${
          active
            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-lg shadow-cyan-500/5"
            : "text-slate-400 border-transparent hover:text-white hover:bg-white/[0.02]"
        }`}
      >
        <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
          active ? "text-cyan-400" : "text-slate-400 group-hover:text-white"
        }`} />
        {label}
      </button>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#070b19] font-sans text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-72 flex-col border-r border-slate-800/80 bg-[#0b1329]/95 backdrop-blur-xl px-6 py-8">
        {/* LOGO */}
        <div className="flex items-center gap-3.5 px-2">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-400 to-cyan-500 shadow-lg shadow-cyan-500/10">
            <img src="/urent.png" alt="logo" className="h-6.5 w-6.5 object-contain" />
            <div className="absolute -inset-0.5 -z-10 animate-pulse rounded-2xl bg-cyan-400 opacity-20 blur-sm"></div>
          </div>

          <div>
            <p className="text-lg font-bold tracking-tight text-white">U-Rent</p>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              ADMIN SPACE
            </p>
          </div>
        </div>
        <nav className="flex flex-col gap-2 mt-4">
          {navItem("Dashboard", "/admin")}
          {navItem("Users", "/admin/users")}
          {navItem("Orders", "/admin/orders")}
          {navItem("Chat", "/admin/chat")}
          {navItem("Logs", "/admin/logs")}
        </nav>

        {/* FOOTER & LOGOUT */}
        <div className="mt-auto flex flex-col gap-5 pt-8 border-t border-slate-800/80">
          <button
            onClick={() => navigate("/")}
            className="group flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.02] transition duration-200"
          >
            <Home className="h-4 w-4 text-slate-500 group-hover:text-white transition duration-200" />
            Back to Client Shop
          </button>

          <button
            onClick={handleLogout}
            className="group flex w-full items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-all duration-300 border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="h-5 w-5 text-rose-400 group-hover:translate-x-0.5 transition-transform duration-200" />
            Sign Out
          </button>
          <div className="px-2 text-[10px] font-medium text-slate-600">
            © 2026 U-Rent Systems. All rights reserved.
          </div>
        </div>
      </aside>

      {/* MAIN SHELL */}
      <div className="flex flex-1 flex-col pl-72">
        {/* STICKY TOP HEADER */}
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-800/60 bg-[#070b19]/80 backdrop-blur-md px-10">
          {/* SEARCH BAR ELEMENT MOCK */}
          <div className="relative flex w-80 items-center">
            <Search className="absolute left-3.5 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-300 placeholder:text-slate-600 focus:border-cyan-500/40 focus:bg-slate-900 focus:outline-none transition duration-300"
              disabled
            />
          </div>

          {/* QUICK CONTROLS & USER PROFILE */}
          <div className="flex items-center gap-6">
            {/* NOTIFICATIONS BAR */}
            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800/80 bg-slate-900/30 text-slate-400 hover:text-white transition hover:bg-slate-900/80">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-cyan-400 ring-4 ring-[#070b19]" />
            </button>

            {/* VERTICAL DIVIDER */}
            <div className="h-6 w-[1px] bg-slate-800" />

            {/* USER ACC INFO */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500/20 to-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold text-sm">
                {initials}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-slate-100">{adminName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <UserCheck className="h-3 w-3 text-teal-400" />
                  <p className="text-[10px] font-medium text-slate-400 capitalize">{user?.role || "Admin"}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* CONTAINER CONTENT */}
        <main className="flex-1 p-10 max-w-8xl">
          {children}
        </main>
      </div>
    </div>
  );
}
