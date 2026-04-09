import { Bell, Search, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const notifications = [
  { id: 1, title: "Đơn hàng #A102 đã gửi", time: "2 phút trước" },
  { id: 2, title: "Tin nhắn mới từ Lan", time: "10 phút trước" },
  { id: 3, title: "Khuyến mãi 20% cho camera", time: "1 giờ trước" },
];

export function AppHeader() {
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-teal-600/50"
          size={18}
          strokeWidth={2}
        />
        <input
          type="search"
          placeholder="Tìm máy ảnh, laptop, hoặc mã đơn hàng..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 outline-none ring-0 transition focus:border-teal-600/35 focus:bg-white focus:shadow-[0_0_0_3px_rgba(13,148,136,0.12)]"
        />
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-teal-600/70 shadow-sm transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-500 cursor-pointer"
            aria-label="Thông báo"
            aria-expanded={isNotifOpen}
            onClick={() => setIsNotifOpen((open) => !open)}
          >
            <Bell size={20} strokeWidth={2} />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 z-20 mt-3 w-[320px] overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-xl">
              <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
                Thông báo mới
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full px-4 py-3 text-left transition hover:bg-slate-50"
                  >
                    <div className="text-sm font-medium text-slate-900">
                      {item.title}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{item.time}</p>
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-200 px-4 py-3 text-center text-sm">
                <button
                  type="button"
                  className="font-semibold text-teal-600 transition hover:text-teal-700"
                  onClick={() => {
                    setIsNotifOpen(false);
                    navigate("/notifications");
                  }}
                >
                  Xem tất cả
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-teal-600/70 shadow-sm transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-500 cursor-pointer"
          aria-label="Cài đặt"
          onClick={() => navigate("/settings")}
        >
          <Settings size={20} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
