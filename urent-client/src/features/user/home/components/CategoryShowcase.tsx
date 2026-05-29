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
    <section className="space-y-5">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {t.title}
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.values(categories).map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryClick(cat.id)}
              className="group relative overflow-hidden rounded-2xl p-6 text-left transition-transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-90 transition-opacity group-hover:opacity-100`}
              />
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />

              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <Icon className="mb-3 text-white" size={32} />
                  <h3 className="text-xl font-bold text-white leading-tight">{cat.label}</h3>
                  <p className="mt-1.5 text-xs text-white/85">
                    {cat.count} {lang === "vi" ? "sản phẩm" : "items"}
                  </p>
                </div>
              </div>

              <div className="absolute bottom-0 right-0 rounded-tl-xl bg-white/20 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                {t.viewAll}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
