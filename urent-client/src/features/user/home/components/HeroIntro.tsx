import { Zap, Truck, RotateCcw, Shield } from "lucide-react";

interface HeroIntroProps {
  lang: "vi" | "en";
}

export function HeroIntro({ lang }: HeroIntroProps) {
  const t =
    lang === "vi"
      ? {
          title: "Thuê thiết bị thông minh",
          subtitle: "Linh hoạt • Minh bạch • Giá hợp lý",
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
          badges: [
            { icon: Shield, label: "Quality products" },
            { icon: Truck, label: "1-2 day delivery" },
            { icon: RotateCcw, label: "Easy returns" },
            { icon: Zap, label: "Best market prices" },
          ],
        };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/50 bg-white dark:border-slate-700/50 dark:bg-slate-900 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/5">
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

      <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10">
        <div className="mx-auto max-w-3xl">
          {/* Main content */}
          <div className="text-center">
            {/* Title */}
            <h1 className="mb-3 text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent dark:from-teal-400 dark:to-cyan-400">
                {t.title}
              </span>
            </h1>

            {/* Subtitle + Description */}
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {t.subtitle}
            </p>

            {/* Trust badges - compact inline */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              {t.badges.slice(0, 2).map((badge, idx) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg border border-slate-200/60 bg-white/40 px-3 py-2 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-800/40"
                  >
                    <Icon
                      className="text-teal-600 dark:text-teal-400"
                      size={16}
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent dark:via-teal-600/30" />
    </section>
  );
}
