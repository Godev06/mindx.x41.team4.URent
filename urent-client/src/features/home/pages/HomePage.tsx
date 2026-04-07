import { ChevronRight } from "lucide-react";
import { PRODUCTS } from "../../shared/data";

interface HomePageProps {
  onProductClick: (id: number) => void;
}

export function HomePage({ onProductClick }: HomePageProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden bg-blue-600 rounded-3xl p-8 text-white">
        <div className="relative z-10 max-w-md">
          <span className="bg-green-400 text-green-900 text-xs font-bold px-2 py-1 rounded mb-4 inline-block italic">
            U-RENT EXCLUSIVE
          </span>
          <h1 className="text-4xl font-bold mb-4 leading-tight">Thue cong nghe voi gia hop ly.</h1>
          <p className="text-blue-100 mb-6">Tai sao phai mua khi ban co the thue theo ngay, tuan hoac thang.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PRODUCTS.map((product) => (
          <div
            key={product.id}
            onClick={() => onProductClick(product.id)}
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="bg-gray-50 aspect-square rounded-xl mb-4 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform">
              {product.image}
            </div>
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-bold text-gray-900">{product.name}</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4 line-clamp-2">{product.category}</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">
                ${product.price}
                <span className="text-sm text-gray-400 font-normal"> / ngay</span>
              </span>
              <button className="p-2 bg-gray-900 text-white rounded-lg group-hover:bg-blue-600 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
