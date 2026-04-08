import { PRODUCTS } from "../../shared/data";
import { Badge } from "../../shared/components/Badge";
import { HeroBanner } from "../components/HeroBanner";
import { ProductCard } from "../components/ProductCard";

interface HomePageProps {
  onProductClick: (id: number) => void;
}

export function HomePage({ onProductClick }: HomePageProps) {
  const highlighted = PRODUCTS.slice(0, 4);

  return (
    <div className="space-y-10">
      <HeroBanner />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04]">
          <p className="text-xs font-medium text-slate-500">Thiết bị sẵn sàng</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{PRODUCTS.length}</p>
        </div>
      
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04]">
          <p className="text-xs font-medium text-slate-500">Đơn hoàn tất tuần này</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">128</p>
        </div>
       
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">Gợi ý cho bạn</h2>
            <p className="text-sm text-slate-500">Thiết bị được thuê nhiều trong tuần qua.</p>
          </div>
          <Badge variant="blue">Top picks</Badge>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {highlighted.map((product) => (
            <ProductCard key={product.id} product={product} onSelect={onProductClick} />
          ))}
        </div>
      </section>
    </div>
  );
}
