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
    teal: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    green:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  };

  return (
    <section className="grid grid-cols-3 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`rounded-xl border border-slate-200/50 p-4 dark:border-slate-700/50 ${
              colorMap[stat.color as keyof typeof colorMap]
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon size={20} />
              <div>
                <p className="text-xs font-medium opacity-70">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
