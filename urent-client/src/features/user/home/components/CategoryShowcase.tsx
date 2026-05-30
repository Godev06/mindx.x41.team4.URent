import { BookOpen, Laptop, Tent, Shirt } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CategoryShowcaseProps {
  lang: "vi" | "en";
  onCategoryClick: (category: string) => void;
}

interface CategoryCard {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  count: number;
}

export function CategoryShowcase({
  lang,
  onCategoryClick,
}: CategoryShowcaseProps) {
  const categories: Record<string, CategoryCard> =
    lang === "vi"
      ? {
          electronics: {
            id: "electronics",
            label: "Điện tử & Công nghệ",
            icon: Laptop,
            color: "teal",
            gradient: "from-teal-500 to-cyan-500",
            count: 45,
          },
          travel: {
            id: "travel",
            label: "Du lịch & Dã ngoại",
            icon: Tent,
            color: "emerald",
            gradient: "from-emerald-500 to-teal-500",
            count: 18,
          },
          study: {
            id: "study",
            label: "Đồ dùng học tập",
            icon: BookOpen,
            color: "blue",
            gradient: "from-blue-500 to-indigo-500",
            count: 28,
          },
          lifestyle: {
            id: "lifestyle",
            label: "Thời trang & Đời sống",
            icon: Shirt,
            color: "amber",
            gradient: "from-amber-500 to-orange-500",
            count: 32,
          },
        }
      : {
          electronics: {
            id: "electronics",
            label: "Electronics & Tech",
            icon: Laptop,
            color: "teal",
            gradient: "from-teal-500 to-cyan-500",
            count: 45,
          },
          travel: {
            id: "travel",
            label: "Travel & Outdoors",
            icon: Tent,
            color: "emerald",
            gradient: "from-emerald-500 to-teal-500",
            count: 18,
          },
          study: {
            id: "study",
            label: "School Supplies",
            icon: BookOpen,
            color: "blue",
            gradient: "from-blue-500 to-indigo-500",
            count: 28,
          },
          lifestyle: {
            id: "lifestyle",
            label: "Fashion & Lifestyle",
            icon: Shirt,
            color: "amber",
            gradient: "from-amber-500 to-orange-500",
            count: 32,
          },
        };

  const t =
    lang === "vi"
      ? {
          title: "Khám phá danh mục",
          viewAll: "Xem tất cả",
        }
      : {
          title: "Browse categories",
          viewAll: "View all",
        };
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {t.title}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Object.values(categories).map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryClick(cat.id)}
              className="group relative overflow-hidden rounded-[2rem] p-4 sm:p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-900/10 active:scale-95 shadow-md border border-white/10 dark:border-white/5"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-90 group-hover:opacity-105 transition-opacity duration-300`}
              />
              {/* Blur backdrop overlay */}
              <div className="absolute inset-0 bg-black/[0.03] backdrop-blur-[1px] group-hover:backdrop-blur-none transition-all" />
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl group-hover:scale-110 transition-transform duration-500" />

              <div className="relative z-10 flex flex-col justify-between h-full min-h-[9rem] sm:min-h-[10rem]">
                <div className="rounded-2xl bg-white/15 p-2.5 w-fit border border-white/25 shadow-sm shrink-0 group-hover:scale-110 group-hover:bg-white/25 transition-all duration-300">
                  <Icon className="text-white" size={24} strokeWidth={2.5} />
                </div>
                <div className="mt-4">
                  <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight tracking-tight drop-shadow-xs">
                    {cat.label}
                  </h3>
                  <p className="mt-1 text-[11px] font-medium text-white/80">
                    {cat.count} {lang === "vi" ? "sản phẩm" : "items"}
                  </p>
                </div>
              </div>

              <div className="absolute bottom-0 right-0 rounded-tl-2xl bg-white/20 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                {t.viewAll}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
