import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Truck, RotateCcw, Shield, Search, ArrowRight } from "lucide-react";

interface HeroIntroProps {
  lang: "vi" | "en";
}

export function HeroIntro({ lang }: HeroIntroProps) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");

  const t =
    lang === "vi"
      ? {
          title: "Thuê thiết bị thông minh",
          subtitle: "Linh hoạt • Minh bạch • Giá hợp lý",
          searchPlaceholder: "Bạn cần thuê thiết bị gì hôm nay?",
          searchBtn: "Tìm kiếm",
          badges: [
            { icon: Shield, label: "Sản phẩm chất lượng" },
            { icon: Truck, label: "Giao nhanh 1-2 ngày" },
            { icon: RotateCcw, label: "Đổi trả dễ dàng" },
            { icon: Zap, label: "Giá tốt nhất thị trường" },
          ],
        }
      : {
          title: "Smart Tech Rental",
          subtitle: "Flexible • Transparent • Affordable",
          searchPlaceholder: "What equipment do you need today?",
          searchBtn: "Search",
          badges: [
            { icon: Shield, label: "Quality products" },
            { icon: Truck, label: "1-2 day delivery" },
            { icon: RotateCcw, label: "Easy returns" },
            { icon: Zap, label: "Best market prices" },
          ],
        };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/products?q=${encodeURIComponent(keyword.trim())}`);
    } else {
      navigate(`/products`);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/50 bg-white dark:border-slate-800/60 dark:bg-slate-900 shadow-lg ring-1 ring-slate-900/5 dark:ring-white/5 transition-all duration-300">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-gradient-to-br from-teal-400/20 to-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-gradient-to-tr from-blue-400/15 to-indigo-400/15 blur-3xl" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 px-4 py-12 sm:px-10 sm:py-16">
        <div className="mx-auto max-w-2xl">
          {/* Main content */}
          <div className="text-center space-y-6">
            {/* Title */}
            <h1 className="text-balance text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent dark:from-teal-400 dark:via-cyan-400 dark:to-teal-300">
                {t.title}
              </span>
            </h1>

            {/* Subtitle + Description */}
            <p className="text-sm sm:text-base font-semibold text-slate-500 dark:text-slate-350">
              {t.subtitle}
            </p>

            {/* Premium Integrated Search Form */}
            <form onSubmit={handleSearchSubmit} className="mx-auto max-w-xl pt-2">
              <div className="relative flex items-center p-1 rounded-2xl sm:rounded-full border border-slate-200/80 bg-slate-50/80 shadow-md focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10 dark:border-white/10 dark:bg-white/5 dark:focus-within:border-teal-400/40 dark:focus-within:ring-teal-400/10 transition-all duration-300">
                <Search className="absolute left-4 h-5 w-5 text-slate-400 pointer-events-none dark:text-slate-500" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-transparent py-3.5 pl-12 pr-28 sm:pr-36 text-sm text-slate-805 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 bottom-1.5 inline-flex items-center justify-center gap-1.5 rounded-xl sm:rounded-full bg-teal-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-teal-700 active:scale-95 transition-all cursor-pointer dark:bg-teal-600 dark:hover:bg-teal-500"
                >
                  <span>{t.searchBtn}</span>
                  <ArrowRight size={14} strokeWidth={2.5} />
                </button>
              </div>
            </form>

            {/* Trust badges - responsive grid */}
            <div className="pt-6">
              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
                {t.badges.map((badge, idx) => {
                  const Icon = badge.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white/60 p-3 sm:px-4 sm:py-2.5 shadow-sm backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-800/40 transition hover:border-teal-500/20 dark:hover:border-teal-400/20"
                    >
                      <Icon
                        className="text-teal-600 dark:text-teal-455 shrink-0"
                        size={16}
                      />
                      <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent dark:via-teal-600/30" />
    </section>
  );
}
