import { PRODUCTS } from "../../shared/data";
import { Badge } from "../../shared/components/Badge";
import { HeroBanner } from "../components/HeroBanner";
import { ProductCard } from "../components/ProductCard";
import { useTheme } from "../../settings/context/ThemeContext";

interface HomePageProps {
  onProductClick: (id: number) => void;
}

export function HomePage({ onProductClick }: HomePageProps) {
  const { theme } = useTheme();
  const highlighted = PRODUCTS.slice(0, 4);

  return (
    <div className="space-y-10">
      <HeroBanner />

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
            Thiết bị sẵn sàng
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
            Đơn hoàn tất tháng này
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
              Gợi ý cho bạn
            </h2>
            <p className="text-sm text-slate-500">
              Thiết bị được thuê nhiều trong tuần qua.
            </p>
          </div>
          <Badge variant="blue">Top picks</Badge>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {highlighted.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onProductClick}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
