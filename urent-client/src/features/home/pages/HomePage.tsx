import { PRODUCTS } from "../../shared/data";
import { Badge } from "../../shared/components/Badge";
import { HeroBanner } from "../components/HeroBanner";
import { ProductCard } from "../components/ProductCard";
import { useTheme } from "../../settings/hooks/useTheme";
import { useI18n } from "../../shared/context/LanguageContext";

interface HomePageProps {
  onProductClick: (id: number) => void;
}

export function HomePage({ onProductClick }: HomePageProps) {
  const { theme } = useTheme();
  const { lang } = useI18n();
  const highlighted = PRODUCTS.slice(0, 4);
  const t =
    lang === "vi"
      ? {
          readyDevices: "Thiết bị sẵn sàng",
          monthlyCompleted: "Đơn hoàn tất tháng này",
          suggested: "Gợi ý cho bạn",
          suggestedDesc: "Thiết bị được thuê nhiều trong tuần qua.",
          topPicks: "Top picks",
          dayUnit: "/ ngày",
        }
      : {
          readyDevices: "Ready devices",
          monthlyCompleted: "Completed this month",
          suggested: "Recommended for you",
          suggestedDesc: "Most-rented devices from last week.",
          topPicks: "Top picks",
          dayUnit: "/ day",
        };

  return (
    <div className="space-y-10">
      <HeroBanner lang={lang} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        <div
          className={`rounded-xl border p-4 shadow-sm ring-1 ${
            theme === "dark"
              ? "border-slate-700 bg-slate-900 ring-white/10"
              : "border-slate-200/90 bg-white ring-slate-900/4"
          }`}
        >
          <h1
            className={`text-sm font-bold tracking-tight ${
              theme === "dark" ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {t.readyDevices}
          </h1>
          <p
            className={`mt-1 text-2xl font-bold ${
              theme === "dark" ? "text-slate-100" : "text-slate-900"
            }`}
          >
            {PRODUCTS.length}
          </p>
        </div>
        <div
          className={`rounded-xl border p-4 shadow-sm ring-1 ${
            theme === "dark"
              ? "border-slate-700 bg-slate-900 ring-white/10"
              : "border-slate-200/90 bg-white ring-slate-900/4"
          }`}
        >
          <h1
            className={`text-sm tracking-tight ${
              theme === "dark" ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {t.monthlyCompleted}
          </h1>
          <p
            className={`mt-1 text-2xl font-bold ${
              theme === "dark" ? "text-slate-100" : "text-slate-900"
            }`}
          >
            128
          </p>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              {t.suggested}
            </h2>
            <p className="text-sm text-slate-500">{t.suggestedDesc}</p>
          </div>
          <Badge variant="blue">{t.topPicks}</Badge>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {highlighted.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onProductClick}
              dayUnit={t.dayUnit}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
