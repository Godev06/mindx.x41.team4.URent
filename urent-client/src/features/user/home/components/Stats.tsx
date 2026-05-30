import { Users, Package, TrendingUp } from "lucide-react";

interface StatsProps {
  lang: "vi" | "en";
  totalItems?: number;
  totalUsers?: number;
}

export function Stats(props: StatsProps) {
  const { lang, totalItems = 125, totalUsers = 5000 } = props;
  const stats =
    lang === "vi"
      ? [
          {
            label: "Sản phẩm",
            value: totalItems,
            icon: Package,
            color: "teal",
          },
          {
            label: "Người dùng",
            value: totalUsers,
            icon: Users,
            color: "blue",
          },
          {
            label: "Giao dịch",
            value: "3.2k",
            icon: TrendingUp,
            color: "green",
          },
        ]
      : [
          {
            label: "Items",
            value: totalItems,
            icon: Package,
            color: "teal",
          },
          {
            label: "Users",
            value: totalUsers,
            icon: Users,
            color: "blue",
          },
          {
            label: "Transactions",
            value: "3.2k",
            icon: TrendingUp,
            color: "green",
          },
        ];

  const colorMap = {
    teal: "border-teal-100/70 bg-teal-50/45 text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/5 dark:text-teal-300",
    blue: "border-blue-100/70 bg-blue-50/45 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/5 dark:text-blue-300",
    green: "border-emerald-100/70 bg-emerald-50/45 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/5 dark:text-emerald-300",
  };

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`rounded-2xl border p-5 backdrop-blur-sm shadow-xs transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${
              colorMap[stat.color as keyof typeof colorMap]
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-white/70 p-2.5 shadow-inner dark:bg-slate-950/20 shrink-0">
                <Icon size={22} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider opacity-85 truncate">{stat.label}</p>
                <p className="text-2xl font-black tracking-tight mt-0.5 tabular-nums truncate">{stat.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
