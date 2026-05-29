import React, { useMemo } from "react";
import { useTheme } from "../../settings/hooks/useTheme";

type FilterMode = "all" | "renter" | "owner";

interface Order {
  renterId: string;
  ownerId: string;
}

interface OrdersFilterTabsProps {
  current: FilterMode;
  onChange: (mode: FilterMode) => void;
  orders: Order[];
  user: { id: string } | null;
}

const OrdersFilterTabs: React.FC<OrdersFilterTabsProps> = ({
  current,
  onChange,
  orders,
  user,
}) => {
  const { theme } = useTheme();

  const counts = useMemo(() => {
    return {
      all: orders.length,
      renter: user
        ? orders.filter((o) => String(o.renterId) === String(user.id)).length
        : 0,
      owner: user
        ? orders.filter((o) => String(o.ownerId) === String(user.id)).length
        : 0,
    };
  }, [orders, user]);

  const tabs: Array<{
    key: FilterMode;
    label: string;
    count: number;
  }> = [
      { key: "all", label: "Tất cả", count: counts.all },
      { key: "renter", label: "Tôi thuê", count: counts.renter },
      { key: "owner", label: "Tôi cho thuê", count: counts.owner },
    ];

  return (
    <div className={`flex gap-1.5 rounded-2xl p-1 shadow-sm border transition-all duration-200 ${
      theme === "dark"
        ? "border-slate-800 bg-slate-900/60 ring-1 ring-white/5"
        : "border-slate-200/80 bg-slate-50/50 backdrop-blur-md"
    }`}>
      {tabs.map((tab) => {
        const active = current === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            aria-pressed={active}
            className={`
              group flex items-center gap-2 rounded-xl px-4 py-2
              text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer
              ${active
                ? theme === "dark"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "bg-slate-900 text-white shadow-xs"
                : theme === "dark"
                  ? "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }
            `}
          >
            <span>{tab.label}</span>

            <span
              className={`
                rounded-lg px-2 py-0.5 text-[10px] font-black transition-all
                ${active
                  ? theme === "dark"
                    ? "bg-slate-100 text-slate-900"
                    : "bg-slate-850 text-white"
                  : theme === "dark"
                    ? "bg-slate-800 text-slate-400 group-hover:bg-slate-700/80 group-hover:text-slate-250"
                    : "bg-slate-200/60 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-800"
                }
              `}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default OrdersFilterTabs;