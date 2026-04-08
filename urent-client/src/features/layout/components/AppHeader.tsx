import { Bell, Search, Settings } from "lucide-react";

export function AppHeader() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="relative min-w-0 flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-teal-600/50" size={18} strokeWidth={2} />
        <input
          type="search"
          placeholder="Tìm máy ảnh, laptop, hoặc mã đơn hàng..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 outline-none ring-0 transition focus:border-teal-600/35 focus:bg-white focus:shadow-[0_0_0_3px_rgba(13,148,136,0.12)]"
        />
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-teal-600/70 shadow-sm transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-500"
          aria-label="Thông báo"
        >
          <Bell size={20} strokeWidth={2} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
        </button>
        <button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-teal-600/70 shadow-sm transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-500"
          aria-label="Cài đặt"
        >
          <Settings size={20} strokeWidth={2} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}
