import { useLocation, useNavigate } from "react-router-dom";

export function AdminSidebar() {
  const navigate = useNavigate();

  const location = useLocation();

  const menuItems = [
    {
      label: "Dashboard",
      path: "/admin",
    },
    {
      label: "Users",
      path: "/admin/users",
    },
    {
      label: "Orders",
      path: "/admin/orders",
    },
    {
      label: "Support Chat",
      path: "/admin/chat",
    },
    {
      label: "Logs",
      path: "/admin/logs",
    },
  ];

  return (
    <div className="flex min-h-screen w-72 flex-col border-r border-slate-800 bg-slate-950 px-5 py-6">
      {/* LOGO */}
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10">
          <img src="/urent.png" className="h-10 w-10 object-contain" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">U-Rent</h1>

          <p className="text-sm tracking-[0.2em] text-slate-400">ADMIN</p>
        </div>
      </div>

      {/* MENU */}
      <div className="space-y-3">
        {menuItems.map((item) => {
          const active =
            item.path === "/admin"
              ? location.pathname === "/admin"
              : location.pathname.startsWith(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full rounded-2xl px-5 py-4 text-left text-lg font-medium transition-all duration-200 ${
                active
                  ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 shadow-lg shadow-cyan-500/5"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* FOOTER */}
      <div className="mt-auto pt-10 text-sm text-slate-500">© U-Rent Admin</div>
    </div>
  );
}
