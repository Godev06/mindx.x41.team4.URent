import { useLocation, useNavigate } from "react-router-dom";
import { SidebarItem } from "../../shared/components/SidebarItem";
import { MAIN_NAV_ITEMS } from "../constants/navItems";

export function AppSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-18 z-40 flex flex-col items-center border-r border-slate-200 bg-white py-5 shadow-[4px_0_24px_-10px_rgba(15,118,110,0.20)]">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg shadow-teal-900/20 ring-1 ring-teal-600/20 transition hover:scale-[0.95]"
        aria-label="U-Rent — Trang chủ"
      >
        <img src="/urent.png" alt="U-Rent" className="h-11 w-11" />
      </button>

      <nav className="flex w-full flex-1 flex-col gap-2 px-2">
        {MAIN_NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            active={item.isActive(pathname)}
            onClick={() => navigate(item.path)}
          />
        ))}
      </nav>

      <div className="mt-6 h-9 w-9 rounded-full bg-teal-100 ring-1 ring-teal-600/20" aria-hidden />
    </aside>
  );
}
